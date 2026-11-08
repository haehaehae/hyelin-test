/* A curated collection, not a popularity ranking. Tutorial artwork stays on its original site. */
(function () {
  const base='https://origami.guide/';
  const rows=[
    ['crane','종이학','학','crane','animal','보통',12,'날개를 펼친 종이학. 가장 익숙한 전통 종이접기예요.','origami-animals/origami-birds/traditional-origami-crane/','crane'],
    ['cat','고양이 얼굴','고양이 냥이 cat','cat','animal','쉬움',5,'뾰족한 귀에 표정을 더하면, 나만의 고양이가 돼요.','origami-animals/origami-cats/easy-origami-cat-face/'],
    ['dog','강아지 얼굴','강아지 개 멍멍 dog','dog','animal','아주 쉬움',4,'축 처진 귀가 사랑스러운 첫 동물 접기.','origami-animals/origami-dogs/easy-origami-dog-face/'],
    ['fox','꼬마 여우','여우 fox','fox','animal','쉬움',7,'삼각형 얼굴과 꼬리가 돋보이는 작은 여우.','origami-animals/origami-foxes/origami-fox/'],
    ['rabbit','토끼 얼굴','토끼 bunny rabbit','rabbit','animal','쉬움',5,'길쭉한 두 귀를 나란히 세워보세요.','origami-animals/origami-rabbits/easy-origami-rabbit-face/'],
    ['frog','점프하는 개구리','개구리 frog','frog','animal','보통',10,'엉덩이를 살짝 누르면 폴짝 뛰는 종이 친구.','origami-animals/origami-frogs/origami-jumping-frog/'],
    ['butterfly','팔랑팔랑 나비','나비 butterfly','butterfly','animal','쉬움',7,'한 장의 종이에서 가벼운 두 날개가 펼쳐져요.','origami-animals/origami-butterflies/traditional-origami-butterfly/'],
    ['fish','작은 물고기','물고기 생선 fish','fish','animal','쉬움',5,'꼬리와 지느러미를 접어 종이 바다를 만들어보세요.','origami-animals/origami-fish/easy-origami-fish/'],
    ['swan','우아한 백조','백조 swan','swan','animal','쉬움',7,'가늘게 접은 목을 세우면 우아한 백조가 돼요.','origami-animals/origami-birds/origami-swan/'],
    ['whale','바다의 고래','고래 whale','whale','animal','쉬움',5,'넓은 몸과 작은 꼬리로 완성하는 바다 동물.','origami-animals/origami-whales/origami-whale/'],
    ['airplane','멀리 나는 비행기','비행기 종이비행기 airplane plane','airplane','life','쉬움',5,'가운데 몸통과 두 날개를 가진 익숙한 종이비행기.','https://origamisimulator.org/?model=Origami/airplane.svg','airplane'],
    ['boat','둥실 종이배','배 보트 종이배 boat','boat','life','쉬움',7,'접은 종이를 양옆으로 펼쳐, 작은 배를 띄워보세요.','origami-vehicles/origami-boats/traditional-origami-boat/'],
    ['heart','마음을 담은 하트','하트 heart','heart','decor','쉬움',5,'편지에 붙이거나 선물에 더하기 좋은 종이 하트.','origami-hearts/origami-heart/'],
    ['lily','활짝 핀 백합','백합 꽃 lily','lily','decor','보통',15,'꽃잎을 하나씩 펼쳐 입체적인 꽃을 만들어요.','origami-flowers/origami-lily/'],
    ['lotus','물 위의 연꽃','연꽃 꽃 lotus','lotus','decor','보통',12,'겹겹이 펼친 꽃잎이 둥글게 모이는 전통 연꽃.','origami-flowers/origami-lotus-flower/'],
    ['star','반짝이는 별','별 star','star','decor','쉬움',7,'종이의 뾰족한 끝들이 작은 별이 되는 순간.','origami-stars/easy-origami-star/'],
    ['box','차곡차곡 작은 상자','상자 박스 box masu','box','life','보통',10,'작은 물건을 담을 수 있는 전통 마스 상자.','origami-boxes/origami-masu-box/'],
    ['cup','종이컵','컵 cup','cup','life','쉬움',4,'삼각형에서 시작해 입구를 벌리는 기본 컵 접기.','traditional-origami/origami-drinking-cup/'],
    ['hat','꼬마 모자','모자 hat','hat','life','쉬움',5,'큰 종이로 접으면 직접 써볼 수도 있어요.','origami-clothes/easy-origami-hat/'],
    ['letter','작은 편지봉투','봉투 편지 envelope letter','envelope','life','쉬움',5,'한 장을 차근차근 접어, 작은 마음을 담는 봉투로.','https://github.com/amandaghassaei/OrigamiSimulator','letter']
  ];
  const category={animal:'동물 친구들',decor:'꽃과 작은 장식',life:'생활 속 종이접기'};
  const colors=['7c9baa','bd9b59','b9846d','d48e56','b5a3b0','879c81','b796b1','7c9baa','b0bdb9','7e9caa'];
  const catalog=rows.map((row,i)=>{
    const [id,name,words,shape,group,level,time,description,path,simulation]=row;
    return {id,name,short:name,aliases:words.split(' '),shape,group,level,time,description,category:category[group],color:colors[i%colors.length],reference:path.startsWith('https://')?path:base+path,simulation,paper:['airplane','boat','hat'].includes(id)?'직사각형 종이 1장':'정사각형 색종이 1장',size:id==='airplane'?'A4 용지':id==='hat'?'A4 또는 큰 직사각형 종이':'15 × 15 cm 권장'};
  });
  for (const id of ['crane','airplane']) {
    const entry=catalog.find(item=>item.id===id);
    PaperRecipes.recipes.push({...entry,mode:'overall',pattern:id+'.svg',lines:[],tip:'원본 도안의 모든 접힘선을 함께 움직이는 3D 탐색입니다. 사람이 따라 접는 순서는 원본 안내를 확인해주세요.',steps:[['전체 접힘 탐색','재생하거나 슬라이더를 움직여 도안 전체가 접히는 모습을 살펴보세요. 이 모델은 순차 접기 안내가 아닌 전체 접힘 시뮬레이션입니다.','종이 두께와 충돌이 생략되어 일부 면은 서로 통과할 수 있어요.']]});
  }
  PaperRecipes.catalog=catalog;
})();
