import http from "k6/http";
import { check } from "k6";

export const options = {
    vus: 20,
    duration: "10s",
};

export default function () {
    const userId = `load-user-${__VU}-${__ITER}`;

    const response = http.post(
        "http://localhost:3000/api/seats/hold",
        JSON.stringify({
            seatId: 9,
            userId: userId,
        }),
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    check(response, {
        "request completed": (res) =>
            res.status === 200 || res.status === 409,

        "response is JSON": (res) =>
            res.headers["Content-Type"]?.includes("application/json"),
    });
}