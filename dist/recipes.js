/* Four original beginner patterns. FOLD constructs the shared mesh edges. */
window.PaperRecipes = (function () {
  const FOLD = require('fold');
  const recipes = [
    { id:'letter', name:'작은 편지봉투', short:'편지봉투', aliases:['봉투','편지','letter','envelope'], category:'마음을 전하는', time:5, level:'쉬움', paper:'정사각형 색종이 1장', size:'15 × 15 cm', color:'db7357', accent:'#f1c4b4', description:'한 장을 차근차근 접어, 작은 마음을 담는 봉투로.', tip:'마지막 뚜껑은 스티커나 테이프로 고정하면 좋아요.', shape:'envelope',
      lines:[[1,1,1,4,174],[-1,1,1,1,174],[1,1,-1,3,174],[1,-1,1,2,174]],
      steps:[
        ['왼쪽 모서리를 가운데로','색이 있는 면을 아래로 놓으세요. 왼쪽 모서리를 종이 중심에 맞춰 접습니다.','왼쪽 끝과 가운데가 정확히 만나는지 확인하세요.'],
        ['오른쪽 모서리도 가운데로','반대쪽 모서리도 중심에 맞춰 접어요. 양쪽 날개가 서로 마주 보게 됩니다.','좌우가 대칭이면 다음 단계가 더 쉬워져요.'],
        ['아래쪽을 올려 접기','아래 모서리를 위로 올려 가운데에 맞춥니다. 안에 쪽지를 넣을 공간이 생겨요.','종이 두께와 겹침은 화면에서 단순화되어 보여요.'],
        ['윗부분을 덮어 완성','쪽지를 넣고 위쪽 모서리를 접어 덮으세요. 스티커로 고정하면 작은 봉투 완성!','네 모서리를 가운데로 모으는 기본 편지접기입니다.']
      ]
    },
    { id:'gate', name:'양쪽 문접기', short:'문접기', aliases:['문','gate','기본접기','문접기'], category:'처음 배우는', time:2, level:'아주 쉬움', paper:'정사각형 색종이 1장', size:'15 × 15 cm', color:'879c81', accent:'#cfdbc7', description:'양쪽 끝이 가운데에서 만나요. 여러 작품의 시작이 되는 기본 접기.', tip:'중심은 종이를 가볍게 반으로 접었다 펴서 표시할 수 있어요.', shape:'gate',
      lines:[[1,0,-.5,1,176],[1,0,.5,2,176]],
      steps:[['왼쪽을 중심선까지','왼쪽 끝을 가운데 세로선에 맞춰 접으세요. 접는 선은 종이 너비의 ¼ 지점입니다.','종이를 가볍게 반으로 접었다 펴서 중심을 먼저 표시해도 좋아요.'],['오른쪽을 접어 문 닫기','오른쪽 끝도 가운데에 맞춥니다. 두 끝이 중심에서 만나면 문접기 완성!','양쪽 끝을 겹치지 않게 나란히 맞춰보세요.']]
    },
    { id:'accordion', name:'차곡차곡 아코디언', short:'아코디언', aliases:['아코디언','부채','주름','accordion','fan'], category:'리듬을 만드는', time:4, level:'쉬움', paper:'정사각형 색종이 1장', size:'15 × 15 cm', color:'bd9b59', accent:'#e9d9b4', description:'산과 골을 번갈아 접으면, 종이에도 리듬이 생깁니다.', tip:'완성한 주름의 아래를 모아 테이프로 붙이면 작은 부채가 돼요.', shape:'accordion',
      lines:[[-1,0,2/3,1,145],[-1,0,1/3,2,-145],[-1,0,0,3,145],[-1,0,-1/3,4,-145],[-1,0,-2/3,5,145]],
      steps:[['첫 번째 골짜기 만들기','종이를 같은 폭의 여섯 칸으로 나눠 표시합니다. 왼쪽 첫 번째 선을 안쪽으로 접으세요.','화면의 점선은 안쪽으로 접는 골접기를 뜻해요.'],['반대 방향으로 접기','바로 옆 선은 바깥쪽으로 접습니다. 산접기와 골접기가 번갈아 나타나요.','같은 폭으로 접는 것이 포인트예요.'],['다시 안쪽으로','세 번째 선을 첫 번째 선과 같은 방향으로 접으세요.','주름을 손톱으로 가볍게 눌러 정리해요.'],['한 번 더 바깥쪽으로','네 번째 선은 바깥쪽으로 접습니다. 지그재그 모양이 만들어져요.','빨간 점선은 바깥으로 접는 산접기입니다.'],['마지막 주름 접기','마지막 선을 안쪽으로 접은 뒤, 주름을 살짝 펼쳐보세요. 아코디언 접기 완성!','시뮬레이션은 주름을 보기 쉽도록 145도까지만 접어요.']]
    },
    { id:'triangle', name:'첫 번째 삼각 접기', short:'삼각 접기', aliases:['삼각','세모','triangle','기본','반접기'], category:'한 번의 접기로', time:1, level:'아주 쉬움', paper:'정사각형 색종이 1장', size:'15 × 15 cm', color:'7c9baa', accent:'#cfdee3', description:'마주 보는 두 모서리를 만나게 해보세요. 모든 종이접기의 첫걸음.', tip:'정확히 포갠 뒤 가운데에서 바깥쪽으로 눌러 접어주세요.', shape:'triangle',
      lines:[[1,-1,0,1,178]],
      steps:[['마주 보는 모서리 만나기','색이 있는 면이 바깥으로 보이도록 대각선 방향으로 반 접으세요. 두 모서리를 맞춘 뒤 접힌 선을 눌러줍니다.','보여주기 위해 화면에서는 완전히 붙기 직전까지만 접습니다.']]
    }
  ];
  function makeFold(recipe) {
    let polygons = [[[-1,-1],[1,-1],[1,1],[-1,1]]];
    const eps=1e-7;
    for (const [a,b,c] of recipe.lines) {
      const result=[];
      for (const polygon of polygons) {
        for (const sign of [1,-1]) {
          const out=[];
          for(let i=0;i<polygon.length;i++) {
            const p=polygon[i], q=polygon[(i+1)%polygon.length];
            const dp=a*p[0]+b*p[1]-c, dq=a*q[0]+b*q[1]-c;
            if(sign*dp>=-eps) out.push(p);
            if(dp*dq < -eps*eps) { const t=dp/(dp-dq); out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]); }
          }
          const clean=out.filter((p,i)=>i===0||Math.hypot(p[0]-out[i-1][0],p[1]-out[i-1][1])>eps);
          if(clean.length>=3 && Math.abs(clean.reduce((sum,p,i)=>{const q=clean[(i+1)%clean.length];return sum+p[0]*q[1]-p[1]*q[0];},0))>eps) result.push(clean);
        }
      }
      polygons=result;
    }
    const vertices=[], index=new Map();
    const faces=polygons.map(polygon=>polygon.map(p=>{const key=p.map(v=>v.toFixed(6)).join(',');if(!index.has(key)){index.set(key,vertices.length);vertices.push(p);}return index.get(key);}).reverse());
    let fold={ file_spec:1.1, file_creator:'Paper Recipe · OrigamiSimulator + FOLD', file_title:recipe.name, frame_classes:['creasePattern'], frame_attributes:['2D'], vertices_coords:vertices, faces_vertices:faces };
    FOLD.convert.faces_vertices_to_edges(fold);
    const groups=[];
    fold.edges_assignment=fold.edges_vertices.map((edge,i)=>{
      const p=vertices[edge[0]], q=vertices[edge[1]];
      const boundary=[0,1].some(axis=>Math.abs(Math.abs(p[axis])-1)<eps&&Math.abs(p[axis]-q[axis])<eps);
      if(boundary){groups[i]=0;return 'B';}
      const line=recipe.lines.find(([a,b,c])=>Math.abs(a*p[0]+b*p[1]-c)<eps&&Math.abs(a*q[0]+b*q[1]-c)<eps);
      groups[i]=line?line[3]:0;
      return line&&line[4]<0?'M':line?'V':'F';
    });
    fold.edges_foldAngle=fold.edges_vertices.map((edge,i)=>{
      if(!groups[i])return fold.edges_assignment[i]==='B'?null:0;
      return recipe.lines.find(line=>line[3]===groups[i])[4];
    });
    return {fold,groups};
  }
  return { recipes, makeFold, FOLD };
})();
