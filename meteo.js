"use strict";

//cache tous les contenants
function cacheTout() {
    'use strict';
    $(".contenant").hide();
}

//montre les contenants de la liste
function montre(liste) {
    'use strict';
    var i;
    for (i = 0; i < liste.length; ++i) {
        $("#" + liste[i]).show();
    }
}

//table d'association pour la ville
var villeCourante = {
    nom: "Liège",//ATTENTION Liège et Liege renvoi un résultat différent sur Wikipedia
    pays: "BE"
}

//table d'association pour les unités de mesures
var unitesPossibles = {
    temp: ["°C", "°F", "°K"],
    vent: ["m/s", "km/h", "kts"],
    visibilite: ["m", "km"],
    pression: ["hPa", "bar"]
}
//table d'association pour choisir les unités [x] index du tableau des unitesPossibles
var unitesChoisies = {
    temp: 0,
    vent: 0,
    visibilite: 0,
    pression: 0
}
//table d'association des valeurs
var valeursCourantes = {
    temp: -42,
    vent: 10,
    visibilite: 5,
    pression: 1013,
    nuage: "gris",
    description: "Liège est une ville francophone de l'est de la Belgique. Elle est le chef-lieu de la province de Liège et la capitale économique de la Wallonie. De 972 à 1795, elle fut la capitale de la Principauté de Liège2. Du VIIIe au XVIe siècle, elle fut le siège du vaste évêché de Liège, héritier de la Civitas Tungrorum. En 2013, Liège compte quelque 200 000 habitants. Son agglomération est peuplée d'environ 700 000 habitants. Par le nombre d'habitants, c'est la première agglomération wallonne, la troisième agglomération de Belgique après Bruxelles et Anvers et la quatrième commune après Anvers, Gand et Charleroi."
}

//Function qui crée la map et son calque et recoit les coordonnée et une icon
function createMap(coord, icon) {
    //Cration de la Map (13 = niveau de zoom par défaut)
    var mymap = L.map('map').setView(coord, 13);

    //Création du calque image
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiZnJlZG5pY28iLCJhIjoiY2sxemJkcHZlMHR1dDNmcWVkZndpZGF6YiJ9.3K4k5fFbuBVSMzvYOnvq7Q'
    }).addTo(mymap);

    L.marker(coord, {icon: icon}).addTo(mymap);//Localisation de l'icone sur la carte au coordonnée récupérée sur openweathermap
}

//lecture d'un document xml et mise à jour des valeursCourantes
function litConfig(callback) {
    var liste = [];
    $.getJSON("pref.json", function (data) {
        $(data).each(function () {
            unitesChoisies.temp = data.temp.unite;
            unitesChoisies.vent = data.vent.unite;
            unitesChoisies.visibilite = data.nuage.visib.unite;
            unitesChoisies.pression = data.pression.unite;
            if (data.temp.state === 1) {
                liste.push('temp');
            }
            if (data.pression.state === 1) {
                liste.push('pression');
            }
            if (data.vent.state === 1) {
                liste.push('vent');
            }
            if (data.nuage.visib.state === 1) {
                liste.push('visibilite');
            }
            if (data.nuage.status === 1) {
                liste.push('nuage');
            }
            if (data.description.status === 1) {
                liste.push('description');
            }
            montre(liste);
            callback();
        });
    }, "json");
}

function litDonnees(callback) {
    $.ajax({//lecture d'un document json avec ajax et mise à jour de la description de la ville
        url: "https://fr.wikipedia.org/w/api.php?action=opensearch&search="+villeCourante.nom+"&format=json&callback=?",
        //data: { action: "opensearch", search : villeCourante.nom , format : "json", callback : "?""},
        dataType: "json",
        success: function(ville) {
            valeursCourantes.description = ville[2];//va chercher la description de la ville dans l'objet et le met dans valeursCourantes.description
            callback();
        },
        
        error: function traiteErreur(jqXHR, textStatus, errorThrown) {
            alert("Erreur API WIKI" + errorThrown + " : " + textStatus);
        }
    })
    $.ajax({//lecture d'un document json avec ajax et mise à jour des valeursCourantes venant de l'API openweathermap
        url: "http://api.openweathermap.org/data/2.5/weather",
        data: { q: villeCourante.nom +"," + villeCourante.pays, units: "metric", lang: "fr", appid: "b6135e53092a6618cb3dbe7b62d13e02" },
        dataType: "json",
        success: function (data) {
            //console.log(data);
            valeursCourantes.temp = data.main.temp;      
            valeursCourantes.vent = data.wind.speed;
            valeursCourantes.visibilite = data.visibility;
            valeursCourantes.pression = data.main.pressure;
            valeursCourantes.nuage = data.weather[0].description;
            $("#icon").attr("src", "http://openweathermap.org/img/wn/"+data.weather[0].icon+".png");//affiche l'icon meteo en fonction de la description du temps
            
            //Coordonnée récupérée sur openweathermap
            var coordonnees = [data.coord.lat, data.coord.lon];

            //Création du marqueur personaliser avec l'icone de openweathermap
            var markerIcon = L.icon({
                iconUrl: "http://openweathermap.org/img/wn/"+data.weather[0].icon+".png",
            });
            createMap(coordonnees, markerIcon);//appel de la création de map et passage des coordonnées et de l'icon
            callback();
        },
        error: function traiteErreur(jqXHR, textStatus, errorThrown) {
            alert("Erreur API meteo" + errorThrown + " : " + textStatus);
        }
    });
}

//calcul et renvoi le vent en fonction de l'unité choisie
function valeurVent() {
    'use strict';
    if (unitesChoisies.vent === 0) {
        return valeursCourantes.vent;
    }
    if (unitesChoisies.vent === 1) {
        return valeursCourantes.vent / 3.6;
    }
    return valeursCourantes.vent / 1.852;
}

//calcul et renvoi la pression en fonction de l'unité choisie
function valeurPression() {
    'use strict';
    if (unitesChoisies.pression === 0) {
        //console.log(valeursCourantes.pression);
        return valeursCourantes.pression;
    }
    return valeursCourantes.pression / 1000;
}

//calcul et renvoi la température en fonction de l'unité choisie
function valeurTemp() {
    'use strict';
    if (unitesChoisies.temp === 0) {
        //console.log(valeursCourantes.temp);
        return valeursCourantes.temp;
    }
    if (unitesChoisies.temp === 1) {
        return (valeursCourantes.temp * 9 / 5) + 32;
    }
    return valeursCourantes.temp + 273.15;
}

//calcul et renvoi la visibilite en fonction de l'unité choisie
function valeurVisibilite() {
    'use strict';
    if (unitesChoisies.visibilite === 0) {
        return valeursCourantes.visibilite;
    }
    return valeursCourantes.visibilite / 1000;
}

//calcul et renvoi la couverture nuageuse.
function valeurNuage() {
    'use strict';
    return valeursCourantes.nuage;
}

//retourne la description de la ville
function valeurDescriptionVille() {
    'use strict';
    return valeursCourantes.description;
}

//affiche les valeurs et unités dans les id de la page html 
function afficher() {
    'use strict';
    $("#ville").text(villeCourante.nom);

    $("#vent").find(".contenu").text(valeurVent());
    $("#vent").find(".unite").text(unitesPossibles.vent[unitesChoisies.vent]);

    $("#pression").find(".contenu").text(valeurPression());
    $("#pression").find(".unite").text(unitesPossibles.pression[unitesChoisies.pression]);

    $("#temp").find(".contenu").text(valeurTemp());
    $("#temp").find(".unite").text(unitesPossibles.temp[unitesChoisies.temp]);

    $("#visibilite").find(".contenu").text(valeurVisibilite());
    $("#visibilite").find(".unite").text(unitesPossibles.visibilite[unitesChoisies.visibilite]);

    $("#nuage").find(".contenu").text(valeurNuage());

    $("#description").text(valeurDescriptionVille());
}

$(document).ready(function () {
    cacheTout();
    litConfig(function () {
        litDonnees(function () {
            afficher();
        });  
    });
});




