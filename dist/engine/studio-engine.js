/* Paper Recipe adapter for OrigamiSimulator 7855983 (MIT, Amanda Ghassaei). */
var globals;
(function () {
  var ready = false, fold, groups = [], targets = [], current = 0;
  var view, frame = 0, last = 0, settleUntil = 0, tween, slow = 0;
  var dragUntil = 0, suspended = false, drawing = false, initializationError;
  function send(type, data) { parent.postMessage(Object.assign({ source: 'paper-engine', type: type }, data || {}), location.origin); }
  window.gtag = function () {};

  function makeView() {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color('#f2f1eb');
    var wrapper = new THREE.Object3D(); scene.add(wrapper);
    var camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.01, 100);
    camera.position.set(1.3, 2.6, 1.7); camera.lookAt(new THREE.Vector3());
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    document.getElementById('threeContainer').appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    [[2, 5, 3, 0.45], [-3, 2, -2, 0.2], [0, -4, 1, 0.3]].forEach(function (a) {
      var light = new THREE.DirectionalLight(0xffffff, a[3]); light.position.set(a[0], a[1], a[2]); scene.add(light);
    });
    var controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 2; controls.zoomSpeed = 1.5; controls.noPan = true;
    controls.staticMoving = true; controls.minDistance = 1.5; controls.maxDistance = 8;
    controls.addEventListener('change', function () { if (!drawing) render(); });
    function render() { renderer.render(scene, camera); }
    function wake() { if (!frame && !document.hidden && !suspended) frame = requestAnimationFrame(loop); }
    function loop(now) {
      frame = 0;
      if (suspended || document.hidden) return;
      if (now - last < 1000 / 24) { wake(); return; }
      last = now; drawing = true;
      var started = performance.now();
      try {
        if (globals.needsSync) globals.model.sync();
        if (globals.simNeedsSync) globals.model.syncSolver();
        if (tween) {
          var p = Math.min(1, (now - tween.started) / tween.duration);
          var eased = p * p * (3 - 2 * p);
          applyTargets(tween.from.map(function (v, i) { return v + (tween.to[i] - v) * eased; }));
          if (p === 1) tween = null;
        }
        if (globals.simulationRunning) globals.model.step(globals.numSteps);
        controls.update(); render();
      } catch (error) { drawing = false; halt('error'); send('error', { message: error.message }); return; }
      drawing = false;
      // A browser cannot read system CPU/GPU usage. This only protects its own frame budget.
      slow = performance.now() - started > 100 ? slow + 1 : Math.max(0, slow - 1);
      if (slow >= 8) { halt('budget'); return; }
      if (now > settleUntil && !tween) {
        globals.simulationRunning = false;
        if (now > dragUntil) { send('state', { running: false, reason: 'settled' }); return; }
      }
      wake();
    }
    function halt(reason) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; globals.simulationRunning = false; tween = null;
      send('state', { running: false, reason: reason || 'manual' });
    }
    renderer.domElement.addEventListener('pointerdown', function () { dragUntil = Infinity; wake(); });
    window.addEventListener('pointerup', function () { dragUntil = performance.now() + 300; wake(); });
    renderer.domElement.addEventListener('wheel', function () { dragUntil = performance.now() + 200; wake(); }, { passive: true });
    window.addEventListener('resize', function () {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight); controls.handleResize(); render();
    });
    render();
    return {
      scene: scene, camera: camera, renderer: renderer, modelWrapper: wrapper,
      sceneAddModel: function (object) { wrapper.add(object); },
      startAnimation: wake, startSimulation: function () { resume(1800); },
      pauseSimulation: function () { halt('manual'); },
      resume: resume, halt: halt, render: render,
      resetCamera: function () { controls.reset(); render(); },
      setCameraY: function () { camera.position.set(0, 3.7, 0.001); camera.lookAt(new THREE.Vector3()); controls.update(); render(); },
      setCameraIso: function () { camera.position.set(1.3, 2.6, 1.7); camera.lookAt(new THREE.Vector3()); controls.update(); render(); },
      onWindowResize: function () { window.dispatchEvent(new Event('resize')); }
    };
    function resume(ms) {
      suspended = false; slow = 0; globals.simulationRunning = true;
      settleUntil = performance.now() + (ms || 1600); wake(); send('state', { running: true });
    }
  }
  function applyTargets(values) {
    current = values;
    globals.model.getCreases().forEach(function (crease, i) { crease.targetTheta = values[i]; });
    globals.creaseMaterialHasChanged = true;
  }
  function anglesForStep(step, fraction) {
    var data = globals.pattern.getFoldData();
    return globals.model.getCreases().map(function (crease, i) {
      var edge = crease.edge.nodes.map(function (node) { return node.index; }).sort(function (a, b) { return a - b; }).join(',');
      var group = groups[edge] || 0;
      return targets[i] * (group === 0 || step >= group ? fraction : step > group - 1 ? (step - group + 1) * fraction : 0);
    });
  }
  function load(data) {
    view.halt('loading'); suspended = false;
    globals.studioLoadVersion = (globals.studioLoadVersion || 0) + 1;
    globals.studioPatternReady = null; globals.numSteps = 8;
    fold = JSON.parse(JSON.stringify(data.fold));
    groups = {};
    fold.edges_vertices.forEach(function (edge, i) {
      groups[edge.slice().sort(function (a, b) { return a - b; }).join(',')] = (data.groups || [])[i] || 0;
    });
    globals.creasePercent = 1; globals.shouldChangeCreasePercent = true;
    globals.simulationRunning = true;
    globals.pattern.setFoldData(fold, false);
    globals.model.sync();
    targets = globals.model.getCreases().map(function (crease) { return crease.targetTheta; });
    applyTargets(targets.map(function () { return 0; }));
    globals.model.reset();
    globals.model.setMeshMaterial(); globals.model.updateEdgeVisibility();
    view.setCameraIso(); view.render(); ready = true;
    send('loaded', { vertices: fold.vertices_coords.length, faces: fold.faces_vertices.length });
    if (data.step > 0) go(data.step, 1, 900); else view.resume(300);
  }
  function loadSVG(data) {
    if (['crane.svg', 'airplane.svg'].indexOf(data.pattern) < 0) throw new Error('지원하지 않는 기본 도안입니다.');
    view.halt('loading'); suspended = false; ready = false;
    var version = globals.studioLoadVersion = (globals.studioLoadVersion || 0) + 1;
    globals.numSteps = 16; globals.creasePercent = 1; globals.shouldChangeCreasePercent = true;
    globals.simulationRunning = true;
    globals.studioPatternReady = function () {
      globals.model.sync();
      fold = JSON.parse(JSON.stringify(globals.pattern.getFoldData(true)));
      groups = {};
      fold.edges_vertices.forEach(function (edge) { groups[edge.slice().sort(function (a,b) {return a-b;}).join(',')] = 1; });
      targets = globals.model.getCreases().map(function (crease) { return crease.targetTheta; });
      applyTargets(targets.map(function () { return 0; })); globals.model.reset();
      globals.model.setMeshMaterial(); globals.model.updateEdgeVisibility();
      view.setCameraIso(); view.render(); ready = true;
      send('loaded', { fold: fold, groups: fold.edges_vertices.map(function () { return 1; }) });
      view.resume(300);
    };
    globals.pattern.loadSVG('patterns/' + data.pattern, true, version);
  }
  function go(step, fraction, duration) {
    if (!ready) return;
    var to = anglesForStep(step, fraction === undefined ? 1 : fraction);
    tween = { from: current.slice(), to: to, started: performance.now(), duration: duration || 650 };
    view.resume((duration || 650) + (globals.numSteps > 8 ? 4500 : 1400));
  }
  function initialize() {
    var canvas = document.getElementById('gpuMathCanvas');
    var gl = canvas.getContext('webgl');
    if (!gl || !gl.getExtension('OES_texture_float') || !gl.getExtension('WEBGL_color_buffer_float')) throw new Error('이 브라우저는 필요한 WebGL 부동소수점 텍스처를 지원하지 않습니다. 전개도 모드를 이용해주세요.');
    globals = initGlobals();
    globals.color1 = 'f1dfc3'; globals.color2 = 'db7357'; globals.numSteps = 8;
    globals.simulationRunning = false; globals.backgroundColor = 'f2f1eb';
    globals.warn = function (message) { send('warning', { message: String(message).replace(/<[^>]*>/g, '') }); };
    globals.controls = { setDeltaT: function () {}, updateCreasePercent: function () {} };
    globals.setCreasePercent = function (value) { globals.creasePercent = value; globals.shouldChangeCreasePercent = true; };
    globals.threeView = view = makeView();
    globals.model = initModel(globals);
    globals.dynamicSolver = initDynamicSolver(globals);
    globals.pattern = initPattern(globals);
    send('ready');
  }
  window.addEventListener('message', function (event) {
    if (event.source !== parent || event.origin !== location.origin || !event.data || event.data.source !== 'paper-studio') return;
    var data = event.data;
    try {
      if (data.type === 'ping') { if (initializationError) send('error', {message:initializationError}); else send('ready'); }
      else if (data.type === 'load') load(data);
      else if (data.type === 'loadSVG') loadSVG(data);
      else if (data.type === 'step') go(data.step, data.fraction, data.duration);
      else if (data.type === 'pause') { suspended = true; view.halt('manual'); }
      else if (data.type === 'color') { globals.color2 = data.color; globals.model.setMeshMaterial(); view.render(); }
      else if (data.type === 'edges') { globals.edgesVisible = data.visible; globals.model.updateEdgeVisibility(); view.render(); }
      else if (data.type === 'camera') { data.mode === 'top' ? view.setCameraY() : view.setCameraIso(); }
      else if (data.type === 'snapshot' && ready) {
        var exported = JSON.parse(JSON.stringify(globals.pattern.getFoldData()));
        var positions = globals.model.getPositionsArray();
        exported.vertices_coords = exported.vertices_coords.map(function (_, i) { return [positions[3*i], positions[3*i+1], positions[3*i+2]]; });
        exported.frame_classes = ['foldedForm']; exported.frame_title = data.title || 'Paper Recipe';
        send('export', { fold: exported });
      }
    } catch (error) { if (view) view.halt('error'); send('error', { message: error.message }); }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && view) { suspended = true; view.halt('hidden'); } });
  try { initialize(); } catch (error) { initializationError = error.message; send('error', { message: error.message }); }
})();
