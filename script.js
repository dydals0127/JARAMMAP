//////////////////////////////
// 지도 생성
//////////////////////////////

var map = L.map('map').setView([36.5,127.5],7)

//////////////////////////////
// 베이스맵
//////////////////////////////

var normalMap = L.tileLayer(
'https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png',
{
attribution:'VWorld',
maxZoom:19
})

var satelliteMap = L.tileLayer(
'https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg',
{
attribution:'VWorld',
maxZoom:19
})

var hybridMap = L.layerGroup([
L.tileLayer('https://xdworld.vworld.kr/2d/Satellite/service/{z}/{x}/{y}.jpeg'),
L.tileLayer('https://xdworld.vworld.kr/2d/Hybrid/service/{z}/{x}/{y}.png')
])

normalMap.addTo(map)

//////////////////////////////
// 레이어 컨트롤
//////////////////////////////

var baseMaps = {
"일반지도": normalMap,
"항공지도": satelliteMap,
"하이브리드": hybridMap
}

map.createPane('adminPane')
map.getPane('adminPane').style.zIndex = 650


//////////////////////////////
// 전압별 색상
//////////////////////////////

var voltageColors = {
"154": "#1e90ff",
"345": "#2ecc71",
"765": "#e74c3c"
}

//////////////////////////////
// 변전소 아이콘
//////////////////////////////

var substationIcon = L.icon({
iconUrl: "icons/battery_10952976.png",
iconSize: [28,28],
iconAnchor: [14,14],
popupAnchor: [0,-10]
})

//////////////////////////////
// 조사 지점 아이콘
//////////////////////////////

var locationIcon = L.icon({
iconUrl: "icons/location.png",
iconSize: [26,26],
iconAnchor: [13,26],
popupAnchor: [0,-20]
})

//////////////////////////////
// GeoJSON 목록
//////////////////////////////

var geojsonFiles = [
"data/154kv 라인.geojson",
"data/154kv 명칭.geojson",
"data/345kv 라인.geojson",
"data/345kv 명칭.geojson",
"data/765kv 라인.geojson",
"data/가공_신탕정.geojson",
"data/고창변전소.geojson",
"data/신탕정변전소.geojson",
"data/조사지점_신탕정.geojson"
]

//////////////////////////////
// GeoJSON 로드
//////////////////////////////

geojsonFiles.forEach(function(file){

fetch(file)
.then(res => res.json())
.then(data => {

let color = "#3388ff"

if(file.includes("154kv")) color = voltageColors["154"]
if(file.includes("345kv")) color = voltageColors["345"]
if(file.includes("765kv")) color = voltageColors["765"]

L.geoJSON(data,{

//////////////////////////////
// 라인 스타일
//////////////////////////////

style:function(){
return{
color:color,
weight:3
}
},

//////////////////////////////
// Point 스타일
//////////////////////////////

pointToLayer:function(feature,latlng){

// 변전소
if(file.includes("변전소")){
return L.marker(latlng,{icon:substationIcon})
}

// 조사 지점
if(file.includes("조사지점_신탕정")){
return L.marker(latlng,{icon:locationIcon})
}

// 다른 Point는 표시 안함
return null

}

}).addTo(map)

})

})

//////////////////////////////
// 범례 (Legend)
//////////////////////////////

var legend = L.control({position:'topleft'})

legend.onAdd = function(map){

var div = L.DomUtil.create('div','legend')

div.innerHTML += "<b>송전선 전압</b><br>"
div.innerHTML += '<i style="background:#1e90ff"></i> 154kV<br>'
div.innerHTML += '<i style="background:#2ecc71"></i> 345kV<br>'
div.innerHTML += '<i style="background:#e74c3c"></i> 765kV<br>'

return div

}

legend.addTo(map)

Promise.all([
fetch("data/sido.geojson").then(r=>r.json()),
fetch("data/sig.geojson").then(r=>r.json())
]).then(([sidoData,sigData])=>{

    
console.log(sidoData)
console.log(sigData)

console.log(sidoData.features[0].geometry.coordinates[0][0])

//////////////////////////////
// 시도 레이어
//////////////////////////////

var sidoLayer = L.geoJSON(sidoData,{

pane:'adminPane',

style:{
color:"#ff8c00",
weight:4,
fill:false
},

onEachFeature:function(feature,layer){

var center = layer.getBounds().getCenter()

var label = L.marker(center,{
icon:L.divIcon({
className:"region-label",
html:feature.properties.CTP_KOR_NM
})
})

layer.on("add",function(){
label.addTo(map)
})

layer.on("remove",function(){
map.removeLayer(label)
})

}

}).addTo(map)   // ★ 추가



//////////////////////////////
// 시군구 레이어
//////////////////////////////

var sigLayer = L.geoJSON(sigData,{
pane:'adminPane',

style:{
color:"#ff8c00",
weight:3,
fill:false
},

onEachFeature:function(feature,layer){

var center = layer.getBounds().getCenter()

var label = L.marker(center,{
icon:L.divIcon({
className:"region-label",
html:feature.properties.SIG_KOR_NM
})
})

layer.on("add",function(){
label.addTo(map)
})

layer.on("remove",function(){
map.removeLayer(label)
})

}

}).addTo(map)   // ★ 추가



//////////////////////////////
// 레이어 컨트롤
//////////////////////////////

L.control.layers(baseMaps,{
"시도":sidoLayer,
"시군구":sigLayer
},{
position:"topleft",
collapsed:false
}).addTo(map)

})

//////////////////////////////
// 현재 위치 표시 UI
//////////////////////////////

var locationControl = L.control({position:"topleft"})

locationControl.onAdd = function(){

var div = L.DomUtil.create("div","location-info")
div.innerHTML = "현재 위치 확인 중..."

return div

}

locationControl.addTo(map)

//////////////////////////////
// 현재 위치 가져오기
//////////////////////////////

navigator.geolocation.getCurrentPosition(function(pos){

var lat = pos.coords.latitude
var lon = pos.coords.longitude

reverseGeocode(lon,lat)

})

function reverseGeocode(lon,lat){

var key = "VWORLD_API_KEY"

var url = `https://api.vworld.kr/req/address?service=address&request=getAddress&type=road&point=${lon},${lat}&format=json&key=${key}`

fetch(url)
.then(r=>r.json())
.then(data=>{

var addr = data.response.result[0].text

document.querySelector(".location-info").innerHTML = addr

})

}
