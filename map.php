<!DOCTYPE html>
<html>
  <head>
    <title>Established Map</title>
    <meta name="viewport" content="initial-scale=1.0">
    <meta charset="utf-8">
    <style>
        /* Always set the map height explicitly to define the size of the div
         * element that contains the map. */
        #wrapper {
            float: left;
            width: 100%;
            height: 100%;
        }
        #map {
            float: left;
            width: 75%;
            height: 100%;
        }
        #sidePanel {
            float:right;
            width:25%;
            height: 100%;
            overflow-y: auto;
            background-color: #154479;
            color: #FFFFFF;
        }
        #casenumInput{
            width: 100px;
        }
        .provLines{
            list-style-type:none
        }
        .nameSpan{
            font-weight: bold;
            font-size: 16px; 
        }
        .phoneSpan{
            
        }
        .notesSpan{
            color:#CCCCCC;
        }
        .distSpan{
            font-style: italic;
        }
        #searchPanel{
            margin: 10px;
            font-size: 20px;
        }
        #casenumLabel{
            font-weight: bold;
        }
        /* Optional: Makes the sample page fill the window. */
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
        }
        ol>li{
            margin: 6px;
        }
        ol>li:hover{
            background-color: #285A93;
            cursor: pointer;
        }
        
        ul{
            padding-left: 4px;
        }
        ol{
            
        }

        .spinner {
        display: none;
        position: fixed;
        left: 50%;
        top: 50%;
        height:60px;
        width:60px;
        margin:0px auto;
        -webkit-animation: rotation .6s infinite linear;
        -moz-animation: rotation .6s infinite linear;
        -o-animation: rotation .6s infinite linear;
        animation: rotation .6s infinite linear;
        border-left:6px solid rgba(0,174,239,.15);
        border-right:6px solid rgba(0,174,239,.15);
        border-bottom:6px solid rgba(0,174,239,.15);
        border-top:6px solid rgba(0,174,239,.8);
        border-radius:100%;
     }

     @-webkit-keyframes rotation {
        from {-webkit-transform: rotate(0deg);}
        to {-webkit-transform: rotate(359deg);}
     }
     @-moz-keyframes rotation {
        from {-moz-transform: rotate(0deg);}
        to {-moz-transform: rotate(359deg);}
     }
     @-o-keyframes rotation {
        from {-o-transform: rotate(0deg);}
        to {-o-transform: rotate(359deg);}
     }
     @keyframes rotation {
        from {transform: rotate(0deg);}
        to {transform: rotate(359deg);}
     }
    .collapsible {
        cursor: pointer;
        border: none;
        text-align: left;
        outline: none;
        font-size: 16px;
        font-weight: bold;
    }
    .collapsible:hover {
        background-color: #285A93;
    }
    .collapseContent {
        display: none;
        overflow: hidden;
     }

    </style>
    <script src="../jquery-3.3.1.min.js"></script>
    <script src="../colors.js"></script>
    <script src="../sorttable.js"></script>
    <script src="http://internal.mattar.local/marketing/maps/established/map.js"
    async defer></script>
  <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDhUyMaqXoLQy-I6I_7OZ45RbSn5sWgGb4&callback=initMap&libraries=visualization"
    async defer></script>
  </head>
  <body onload="getPlace()">
    <div id="wrapper">
        <div id="map"></div>   
        <div id="sidePanel">
            <div id="searchPanel">
            <label id="casenumLabel">Case number: </label><input type="number" name="casenum" id="casenumInput" onkeypress="submitCasenum(event);"/>
            <button id="searchButton" onclick="getClient();">Search</button>
            <div class="collapsible" onclick="toggleExpand(this,'collapse1');">
                <u>Provider Roles/Specialties</u> <span class="collapseIndicator">+</span>
            </div>
            <div class="collapseContent" id="collapse1">
                <table>
                    <tr>
                        <td><button onclick="clearRoles();">clear roles</button></td>
                        <td></td>
                        <td><button onclick="clearSpecs();">clear specs</button></td>
                    </tr>
                    <tr>
                        <td>
                            <select name="providerRole" multiple>
                                <option value="Chiropractor">Chiropractor</option>
                                <option value="Dentist">Dentist</option>
                                <option value="Doctor">Doctor</option>
								<option value="Therapist">Therapist</option>
								<option value="Established">Established</option>
                            </select>
                        </td>
                        <td></td>
                        <td>
                            <select name="providerSpec" multiple>
                                <option value="Orthopedist">Acupunture</option>
                                <option value="Orthopedist">Orthopedist</option>
                                <option value="Orthopaedist">Orthopaedist</option>
                                <option value="Spine surgeon">Spine surgeon</option>
                                <option value="Neurologist">Neurologist</option>
                                <option value="Neurosurgeon">Neurosurgeon</option>
                                <option value="Pain Management">Pain Management</option>
								<option value="Massage Therapy">Massage Therapist</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <select name="roleOperator">
                                <option value="AND" selected>AND</option>
                                <option value="OR">OR</option>
                            </select>
                        </td>
                        <td>
                            <select name="joinOperator">
                                <option value="AND" selected>AND</option>
                                <option value="OR">OR</option>
                            </select>
                        </td>
                        <td>
                            <select name="specOperator">
                                <option value="AND">AND</option>
                                <option value="OR" selected>OR</option>
                            </select>
                        </td>
                    </tr>
                </table> 
                <button id="filterButton" onclick="getResults();">Filter</button>
            </div>
            <br>
            <label id="casenumLabel">City: </label>
            <select id="cityCB">
                <option value="Albany">Albany</option>
                <option value="Binghamton">Binghamton</option>
                <option value="Buffalo" selected>Buffalo</option>
                <option value="New York City">New York City</option>
                <option value="Rochester">Rochester</option>
                <option value="Syracuse">Syracuse</option>
            </select>
            <button id="citySearchButton" onclick="getPlace();">Go to city</button>
            <br>
            <label id="clientAddressLabel"></label>
            </div>
            <hr>
            <div id="searchResults">
                <ol id="searchResultsList" type="1">
                    
                </ol>
            </div>
        </div>
    </div>
    <div id="spinner1" class="spinner"></div>
  </body>
</html>