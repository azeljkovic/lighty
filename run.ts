import {get} from './dist/requests/get.js';
import {post} from "./dist/requests/post.js";

const url = 'https://restful-booker.herokuapp.com/booking';
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

await get(url);

// await post(url, body);
