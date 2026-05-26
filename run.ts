import {request} from "./dist/requests/rq.js";
import type {RequestConfig} from "./src/requests/rq.js";

const url = 'https://restful-booker.herokuapp.com/booking';
const bookingUrl = 'https://restful-booker.herokuapp.com/booking/2';
const authUrl = 'https://restful-booker.herokuapp.com/auth'

const booking = {
  "firstname": "James",
  "lastname": "Brown",
  "totalprice": 111,
  "depositpaid": true,
  "bookingdates": {
    "checkin": "2018-01-01",
    "checkout": "2019-01-01"
  },
  "additionalneeds": "Breakfast"
}

const auth: RequestConfig = {
  method: "POST",
  url: authUrl,
  body: {
    "username": "admin",
    "password": "password123"
  }
}

const getAllBookings: RequestConfig = {
  method: "GET",
  url,
};

const getSpecificBooking: RequestConfig = {
  method: "GET",
  url: bookingUrl,
};

const get2: RequestConfig = {
  method: "GET",
  url,
  params: {
    "firstname": "Eric",
    "lastname": "Ericsson",
  }
};

const post: RequestConfig = {
  method: "POST",
  url,
  body: booking,
}

const put: RequestConfig = {
  method: "PUT",
  url: bookingUrl,
  body: booking,
  headers: {
    "Cookie": "token=f9b7f3c81baa348",
  }
}

const patch: RequestConfig = {
  method: "PATCH",
  url: bookingUrl,
  body: {
    "firstname": "Erik",
    "lastname": "Eriksson",
  },
  headers: {
    "Cookie": "token=f9b7f3c81baa348",
  }
}

const dlt: RequestConfig = {
  method: "DELETE",
  url: bookingUrl,
  headers: {
    "Cookie": "token=8322019100bf7ec",
  }
}


request(post);
