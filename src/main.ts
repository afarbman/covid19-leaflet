import { countries } from './countries';
import * as L from 'leaflet';
import posthog from 'posthog-js';
window.location.href.indexOf('127.0.0.1') === -1 && posthog.init("-eWILCIglmtWGRF2C86RKXdVMOA4ngK-mG2jmk5bCAw", { api_host: "https://post-hog-leaflet-covid-monitor.herokuapp.com" });
const covid19ApiUrl = 'https://api.covid19api.com/summary'
const token = 'pk.eyJ1IjoiYXJpZWwtZmFyYm1hbiIsImEiOiJja2RmbmRpa2IweHJoMnhucmhwZnJ2MXB4In0.2uZK1Q_FidfpbNdCY_UH6A'
let map: any;
const iconType = {
    'LOW': 'low',
    'MEDIUM': 'medium'
}

var init = function () {
    map = initMap();
    fetchCovidSummary();
}

const initMap = function () {
    let map = L.map('mapId').setView([51.505, -0.09], 3);
    map.options.minZoom = 3;
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/light-v10',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: token
    }).addTo(map);
    return map;
}

const bindClickEvent = function (marker : any) {
    L.DomEvent.addListener(marker, 'click', function (event: any) {
        const country = event.target.getPopup().getContent().split('<br>')[0].split(':')[1].trim();
        posthog.capture('marker-click', { 'country': country });
    }, marker);

}


const fetchCovidSummary = function () {
    fetch(covid19ApiUrl).then((response) => response.json()).then((data) => {
        countries.forEach((country: any) => {
            const covidCountry = data.Countries.find((covidCountry: any) => covidCountry.CountryCode === country.code);
            country.confirmed = covidCountry ? covidCountry.TotalConfirmed : 0;
            country.ratio = (Math.round(country.confirmed / country.pop2020 * 100) / 100).toFixed(2);
            const icon = country.ratio.toString() === "0.00" ? iconType.LOW : iconType.MEDIUM;
            const marker = L.marker([country.lat, country.long], {
                icon: getIcon(icon)
            })
            marker.bindPopup(`Country : ${country.name}<br>Confirmed Covid-19 cases: ${country.confirmed}<br>Population: ${country.pop2020.toLocaleString()}<br>Population/confirmed ratio:${country.ratio}`);
            marker.addTo(map);
            bindClickEvent(marker);

        });
    });
}


const getIcon = function (iconType: any) {
    return L.icon({
        iconUrl: `marker.${iconType}.svg`,
        iconSize: [24, 37]
    });
}
init();