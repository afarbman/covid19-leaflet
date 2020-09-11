import {
    countries,
    country
} from './countries';
import * as L from 'leaflet';
import posthog from 'posthog-js';
window.location.href.indexOf('127.0.0.1') === -1 && posthog.init("-eWILCIglmtWGRF2C86RKXdVMOA4ngK-mG2jmk5bCAw", {
    api_host: "https://post-hog-leaflet-covid-monitor.herokuapp.com"
});
const covid19ApiUrl = 'https://api.covid19api.com/summary';
const svg_template = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 365 560" enable-background="new 0 0 365 560" xml:space="preserve" width="24" height="37"><g>	<path fill="FILL_PLACEHOLDER" d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9	C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8 c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z"/></g></svg>';
const token = 'pk.eyJ1IjoiYXJpZWwtZmFyYm1hbiIsImEiOiJja2RmbmRpa2IweHJoMnhucmhwZnJ2MXB4In0.2uZK1Q_FidfpbNdCY_UH6A'
let map: any;

var init = function () {
    map = initMap();
    addCovidData(countries);
}

const initMap = function () {
    let map = L.map('mapId').setView([51.505, -0.09], 3);
    map.options.minZoom = 3;
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>, <a href="https://gist.github.com/mlocati/7210513">Dynamic legend coloring</a>',
        maxZoom: 18,
        id: 'mapbox/light-v10',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: token
    }).addTo(map);
    return map;
}

const bindMarkerClickEvent = function (marker: any) {
    L.DomEvent.addListener(marker, 'click', function (event: any) {
        const country = event.target.getPopup().getContent().split('<br>')[0].split(':')[1].trim();
        posthog.capture('marker-click', {
            'country': country
        });
    }, marker);
}


// param: an array of ratio value of each country
// return : a map with the original ration and a normalized value (which represents the original value in a 0-100 scale)
// https://stackoverflow.com/questions/13368046/how-to-normalize-a-list-of-positive-numbers-in-javascript
const normalizeValuesTo100 = function (numbers) {
    const ratio = Math.max.apply(Math, numbers) / 100;
    const map = new Map();
    for (let i = 0; i < numbers.length; i++) {
        map.set(numbers[i], Math.round(numbers[i] / ratio));
    }
    return map;
}



const convertPercentageToHex = function (perc) {
    const reversePrecentage = 100 - perc;
    let r, g, b = 0;
    if (reversePrecentage < 50) {
        r = 255;
        g = Math.round(5.1 * reversePrecentage);
    } else {
        g = 255;
        r = Math.round(510 - 5.10 * reversePrecentage);
    }
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return '#' + ('000000' + h.toString(16)).slice(-6);
}


const addCovidData = async function (sourceCountries: Array < country > ) {
    const countries = await calculateCovidRatio(sourceCountries);
    const iconsMap = getIconsMap(countries);
    addMarkers(countries, iconsMap);
}

const getSvgAsBase64 = function (ratio: number): string {
    const hexColor = convertPercentageToHex(ratio);
    const svg = "data:image/svg+xml;base64," + window.btoa(svg_template.replace('FILL_PLACEHOLDER', `${hexColor}`));
    return svg;
}


const calculateCovidRatio = async function (countries: Array < country > ): Promise < any > {
    return new Promise((resolve, reject) => {
        try {
            fetch(covid19ApiUrl).then((response) => response.json()).then((data) => {
                
                const falseRatioCountries=[];
                // caluclate ratio per country
                countries.forEach((country: any,index:number) => {
                    const covidCountry = data.Countries.find((covidCountry: any) => covidCountry.CountryCode === country.code);
                    country.confirmed = Number.parseInt(covidCountry ? covidCountry.TotalConfirmed : 0);
                    country.ratio = Number.parseFloat((country.confirmed / country.pop2020).toFixed(20));
                    if (country.ratio>1){
                        falseRatioCountries.push(index);
                    }
                });
                falseRatioCountries.forEach(countryIndex=>countries.splice(countryIndex,1));
                resolve(countries);
            })
        } catch (error) {
            reject(error);
        }
    });
}


const getIcon = function (iconSvg: string) {
    return L.icon({
        iconUrl: iconSvg,
        iconSize: [24, 37]
    });
}


function addMarkers(countries: any, iconsMap: Map<Number, string>) {
    countries.forEach((country: any) => {
        const iconSvg = iconsMap.get(country.ratio);
        const marker = L.marker([country.lat, country.long], {
            icon: getIcon(iconSvg)
        });
        marker.bindPopup(`Country : ${country.name}<br>Confirmed Covid-19 cases: ${country.confirmed}<br>Population: ${country.pop2020.toLocaleString()}<br>Population/confirmed ratio:${country.ratio}`);
        marker.addTo(map);
        bindMarkerClickEvent(marker);

    });
}

function getIconsMap(countries: any) {
    const ratioArray = Array.from(new Set(countries.map(country => country.ratio))).sort();
    const normalizedRatioMap = normalizeValuesTo100(ratioArray);
    const iconsMap = new Map();
    ratioArray.forEach((ratioSource) => {
        const normalizedRatioPrctg = normalizedRatioMap.get(ratioSource);
        iconsMap.set(ratioSource, getSvgAsBase64(normalizedRatioPrctg));
    });
    return iconsMap;
}

init();
