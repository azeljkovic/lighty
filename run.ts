import {postRequest} from "./dist/requests/post.js";
import {getRequest} from "./dist/requests/get.js";
import {putRequest} from "./dist/requests/put.js";
import {headRequest} from "./dist/requests/head.js";
import {optionsRequest} from "./dist/requests/options.js";
import {patchRequest} from "./dist/requests/patch.js";
import {responseIsOk} from "./dist/assertions/assert.js";

const url = 'https://restful-booker.herokuapp.com/booking';
const url2 = 'https://restful-booker.herokuapp.com/booking/1';

const body = {
  "firstname": "Jim",
  "lastname": "Brown",
  "totalprice": 111,
  "depositpaid": true,
  "bookingdates": {
    "checkin": "2018-01-01",
    "checkout": "2019-01-01"
  },
  "additionalneeds": "Breakfast"
}

const body2 = {
  "firstname": "x",
  "lastname": "y",
  "totalprice": 111,
  "depositpaid": true,
  "bookingdates": {
    "checkin": "2018-01-01",
    "checkout": "2019-01-01"
  },
  "additionalneeds": "Breakfast"
}

const qp = [{}]


// await getRequest(url);
const rs = await getRequest(url);
responseIsOk(rs);
// await getRequest(url2);
// await getRequest(url, {firstname: "Mary", lastname: "Wilson"});
// await postRequest(url, body2);
// await putRequest(url2, body2);
// await patchRequest();
// await headRequest(url);
// await optionsRequest(url);