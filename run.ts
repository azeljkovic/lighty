import {get} from './dist/requests/get.js';
import {post} from "./dist/requests/post.js";
import {put} from "./dist/requests/put.js";
import {head} from "./dist/requests/head.js";
import {options} from './dist/requests/options.js';

const url = 'https://restful-booker.herokuapp.com/booking';
const patchUrl = 'https://restful-booker.herokuapp.com/booking/53';

const body = {
  "firstname" : "Jim",
  "lastname" : "Brown",
  "totalprice" : 111,
  "depositpaid" : true,
  "bookingdates" : {
    "checkin" : "2018-01-01",
    "checkout" : "2019-01-01"
  },
  "additionalneeds" : "Breakfast"
}

const body2 = {
  "firstname" : "x",
  "lastname" : "y",
  "totalprice" : 111,
  "depositpaid" : true,
  "bookingdates" : {
    "checkin" : "2018-01-01",
    "checkout" : "2019-01-01"
  },
  "additionalneeds" : "Breakfast"
}

await get(url);
// await post(url, body);
// await put(patchUrl, body2);
// await head(url);
// await options(url);