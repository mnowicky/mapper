var map; 
var clientMarker;
var client;
var markers=[];
var providers=[];
var heatmap;
var markersVisible=true;
var heatmapOn=false;
var focusPoint;
var markerRing=1;
var maxRefreshSec=180;
var refreshSec=180;
var paused=false;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 42.966159, lng: -78.703291},
    zoom: 10
  });
  /*var point={lat: 42.966159, lng: -78.703291};
  var marker = new google.maps.Marker({position: point, map: map});
  var infowindow =  new google.maps.InfoWindow({
      content: 'William Mattar, P.C.',
      map: map
  });
  google.maps.event.addListener(marker, 'mouseover', function() {
      infowindow.open(map, this);
  });
  google.maps.event.addListener(marker, 'mouseout', function() {
      infowindow.close();
  });*/

}

function getClient(){
    var casenum=document.getElementsByName("casenum")[0].value;
    var searchType="case";
    spinner.style.display = "block";
    $.post(
        "../bulkSearch.php",
        {casenum: casenum,
        searchType: searchType},
        function(data, status){ loadClient(data);}
    );
}

function getPlace(){
    var city=document.getElementById("cityCB").value;
    var searchType="place";
    spinner.style.display = "block";
    $.post(
        "../bulkSearch.php",
        {searchType: searchType,
        place: city},
        function(data, status){ loadClient(data);}
    );
}

function loadClient(data){
    spinner.style.display = "none";
    var jdata=JSON.parse(data);
    
    if(clientMarker!=null){
        clientMarker.setMap(null);
        clientMarker=null;
    }
    
    var infowindow = null;
    infowindow = new google.maps.InfoWindow({
        content: "holding..."
    });
    
    var point={lat: parseFloat(jdata[0].lat), lng: parseFloat(jdata[0].long)};
    var marker = new google.maps.Marker({
        position: point,
        map: map,
        icon: circleSymbol("#CC0000",12),
        title: jdata[0].fullName});
    clientMarker=marker;
    client=jdata[0];
    var contentString=jdata[0].casenum+"<br>"+jdata[0].fullName;
    marker.html=jdata[0].fullName+"<br>"+jdata[0].casenum+" ("+jdata[0].matcode+" : "+jdata[0].class+")"
        +"<br>Opened: "+jdata[0].dateOpened+" age:"+jdata[0].age;

    google.maps.event.addListener(marker, 'mouseover', function () {
    // where I have added .html to the marker object.
    infowindow.setContent(this.html);
    infowindow.open(map, this);
    });
    marker.addListener('mouseout', function() {
        infowindow.close();
    });
    //fill client name on screen
    document.getElementById("clientAddressLabel").innerHTML=jdata[0].fullName
            +"<br>"+jdata[0].address.replace(/\r\n/g,"<br>");
    
    //focus client
    var center = new google.maps.LatLng(jdata[0].lat, jdata[0].long);
    focusProvider(client);
    loadSearchResults();
}

function getResults(){
    var searchType="provider";
    var searchSpecs="Established";
    var roleOperator=document.getElementsByName("roleOperator")[0].value;
    var specOperator=document.getElementsByName("specOperator")[0].value;
    var joinOperator=document.getElementsByName("joinOperator")[0].value;
    var providerRole=document.getElementsByName("providerRole")[0];
    var roleSelected=getSelectValues(providerRole);
    var providerSpec=document.getElementsByName("providerSpec")[0];
    var specSelected=getSelectValues(providerSpec);
    spinner.style.display = "block";
    $.post(
        "../bulkSearch.php",
        {searchType: searchType,
         searchSpecs: searchSpecs,
         roleOperator: roleOperator,
         specOperator: specOperator,
         joinOperator: joinOperator,
         providerRole: roleSelected,
         providerSpec: specSelected
        },
        function(data, status){ loadResults(data);}
    );
}
function loadResults(data){
    setMapOnAll(null);
    markers=[];
    providers=[];
    //cache results here, for user sorting later. 
    spinner.style.display = "none";
    var jdata=JSON.parse(data);
    
    var infowindow = null;
    infowindow = new google.maps.InfoWindow({
        content: "holding..."
    });
    
    if(jdata.length===500){
        alert("Your search criteria is too broad, only the top 500 results have been shown.");
    }
    for(i=0;i<jdata.length;i++){
        var point={lat: parseFloat(jdata[i].lat), lng: parseFloat(jdata[i].long)};
        var marker = new google.maps.Marker({
            position: point,
            map: map,
            icon: circleSymbol("#11DD11",8),
            title: jdata[i].fullName});
        
        var contentString=jdata[i].fullName;
        marker.html=jdata[i].fullName+"<br>"+formatPhonenum(jdata[i].phonenum);
        if(jdata[i].cellNum!="")
            marker.html=marker.html+"<br>Cell: "+formatPhonenum(jdata[i].cellNum);
        marker.html=marker.html+"<br>"+jdata[i].address.replace(/\r\n/g,"<br>");
        markers[i]=marker;
        providers[i]=jdata[i];
        providers[i].id=i;
        google.maps.event.addListener(marker, 'mouseover', function () {
        // where I have added .html to the marker object.
        infowindow.setContent(this.html);
        infowindow.open(map, this);
        });
        marker.addListener('mouseout', function() {
            infowindow.close();
        });
        
    }
    loadSearchResults();
}

function loadSearchResults(){
    if(client==null||providers==null||providers.length==0)
        return;
    for(i=0;i<providers.length;i++){
        providers[i].distance=calcDistMi(providers[i],client);
        providers[i].matched=false;
    }
    var sortedProviders=[];
    for(i=0;i<10;i++){//load top 10.   
        var closest=null;
        for(j=0;j<providers.length;j++){
            if(providers[j].matched){
                continue;
            }
            if(closest==null){
                closest=providers[j];
                continue;
            }
            if(closest.distance>providers[j].distance)
                closest=providers[j];
        }
        sortedProviders.push(closest);
        closest.matched=true;
    }
    
    var out="";
    for(i=0;i<sortedProviders.length;i++){
        out=out+sortedProviders[i].fullName;
    }
    populateResultsPane(sortedProviders);
}

function populateResultsPane(top10){
    var pane=document.getElementById("searchResultsList");
    pane.innerHTML=null;
    var listItem;
    var br = document.createElement("br");
    
    for(i=0;i<top10.length;i++){
        pane.appendChild(generateListItem(top10[i]));
    }
}

function generateListItem(provider){
    listItem=document.createElement("li");
    listItem.setAttribute("onmouseenter","highlight(\""+provider.id+"\");");
    listItem.setAttribute("onmouseleave","unhighlight(\""+provider.id+"\");");
    listItem.setAttribute("onclick","focusNum(\""+provider.id+"\");");
    ulist=document.createElement("ul");
    ulist.setAttribute("class","provLines");

    nameSpan=document.createElement("span");
    addressSpan=document.createElement("span");
    phoneSpan=document.createElement("span");
    notesSpan=document.createElement("span");
    distSpan=document.createElement("span");
    nameSpan.setAttribute("class", "nameSpan");
    addressSpan.setAttribute("class", "addressSpan");
    phoneSpan.setAttribute("class", "phoneSpan");
    notesSpan.setAttribute("class", "notesSpan");
    distSpan.setAttribute("class", "distSpan");
    nameSpan.innerHTML=provider.fullName;
    addressSpan.innerHTML=provider.address.replace(/\r\n/g,"<br>");
    notesSpan.innerHTML=provider.provNotes;
    phoneSpan.innerHTML=formatPhonenum(provider.phonenum);
    if(provider.cellNum!="")
        phoneSpan.innerHTML=phoneSpan.innerHTML+"<br>Cell: "+formatPhonenum(provider.cellNum);
    distSpan.innerHTML=round(provider.distance,1)+" mi.";

    nameUL=document.createElement("li");
    addressUL=document.createElement("li");
    phoneUL=document.createElement("li");
    notesUL=document.createElement("li");
    distUL=document.createElement("li");
    nameUL.appendChild(nameSpan);
    addressUL.appendChild(addressSpan);
    phoneUL.appendChild(phoneSpan);
    notesUL.appendChild(notesSpan);
    distUL.appendChild(distSpan);

    ulist.appendChild(nameUL);
    ulist.appendChild(addressUL);
    ulist.appendChild(phoneUL);
    ulist.appendChild(notesUL);
    ulist.appendChild(distUL);
    
    listItem.appendChild(ulist);
    return listItem;
}

function formatPhonenum(phonenum){
    ret="("+phonenum.substring(0,3)+") ";
    ret=ret+phonenum.substring(3,6)+"-";
    ret=ret+phonenum.substring(6,10);
    return ret; 
}

function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

function calcDistMi(point1, point2){
    return calcCrow(point1.lat,point1.long,point2.lat,point2.long)*0.621371;
}

//distance in KM
function calcCrow(lat1, lon1, lat2, lon2) 
    {
      var R = 6371; // km
      var dLat = toRad(lat2-lat1);
      var dLon = toRad(lon2-lon1);
      var lat1 = toRad(lat1);
      var lat2 = toRad(lat2);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c;
      return d;
    }

// Converts numeric degrees to radians
function toRad(Value) 
    {
        return Value * Math.PI / 180;
    }
function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function getSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
}

function circleSymbol(color, scale1) {
    return {
        //path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.8,
        strokeColor: '#000',
        strokeWeight: markerRing,
        scale: parseInt(scale1)
   };
}

function focusSymbol(){
    return {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        strokeWeight:2,
        strokeColor:"#B40404"
    };
}

function showSpinner(){
    spinner.style.display = "block";
}

function focusProvider(focProvider){
    var center = new google.maps.LatLng(focProvider.lat, focProvider.long);
    map.panTo(center);
    map.setZoom(12);
}

var spinner = document.getElementById('spinner1');
var btn = document.getElementById("viewTable");
var span = document.getElementsByClassName("close")[0];

function submitCasenum(e){
    if(e.keyCode === 13){
        getClient();
    }
}

function highlight(provNum){
    markers[provNum].setIcon(focusSymbol());
}

function unhighlight(provNum){
    markers[provNum].setIcon(circleSymbol("#11DD11",8));
}

function focusNum(provNum){
    focusProvider(providers[provNum]);
}

function toggleExpand(caller, eleID){
    myEle=document.getElementById(eleID);
    children=myEle.children;
    if(myEle.style.display === "block"){
        myEle.style.display = "none";
    }
    else{
        myEle.style.display = "block";
    }
        
    children=caller.children;
    for(var i=0;i<children.length;i++){
        if(children[i].className==="collapseIndicator"){
            if(children[i].innerHTML === "+"){
                children[i].innerHTML = "-";
            }
            else{
                children[i].innerHTML = "+";
            }
        }
    }
}
function clearRoles(){
    roles=document.getElementsByName("providerRole")[0];
    children=roles.children;
     for(var i=0;i<children.length;i++){
         children[i].selected=false;
     }
}
function clearSpecs(){
    specs=document.getElementsByName("providerSpec")[0];
    children=specs.children;
     for(var i=0;i<children.length;i++){
         children[i].selected=false;
     }
}

getResults();
document.getElementById("casenumInput").focus();