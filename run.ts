import {get} from './dist/requests/get.js';
import {post} from "./dist/requests/post.js";
import {put} from "./dist/requests/put.js";
import {head} from "./dist/requests/head.js";
import {options} from './dist/requests/options.js';
// import {QueryValue} from "./dist/types";

const url = 'https://restful-booker.herokuapp.com/booking';
const url2 = 'https://restful-booker.herokuapp.com/booking/1';

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

const qp = [{}]


// await get(url);
// await get(url2);
await get(url, {firstname: "Mary", lastname: "Wilson"});
// await post(url, body);
// await put(patchUrl, body2);
// await head(url);
// await options(url);