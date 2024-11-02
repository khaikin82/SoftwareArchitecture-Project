const express = require("express");
const axios = require("axios");
const cors = require("cors");
const CircuitBreaker = require("opossum");

const app = express();
const port = 3001;

app.use(cors());

// Định nghĩa một hàm cho API giá vàng
async function fetchGoldPrice() {
  const response = await axios.get(
    "http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v"
  );
  return response.data;
}

// Cấu hình circuit breaker
const breakerOptions = {
  timeout: 5000, // thời gian tối đa cho một yêu cầu (5 giây)
  errorThresholdPercentage: 50, // ngưỡng lỗi cho phép là 50%
  resetTimeout: 10000, // thời gian chờ để thử lại sau khi breaker "ngắt" (10 giây)
};

const breaker = new CircuitBreaker(fetchGoldPrice, breakerOptions);

// Xử lý sự kiện khi circuit breaker mở
breaker.on("open", () =>
  console.warn("Circuit breaker is open. API requests are paused.")
);
breaker.on("halfOpen", () =>
  console.warn("Circuit breaker is half-open. Testing API again.")
);
breaker.on("close", () =>
  console.log("Circuit breaker is closed. API requests are operational.")
);

// API endpoint cho giá vàng
app.get("/api/gold-price", async (req, res) => {
  try {
    const data = await breaker.fire();
    res.json(data);
  } catch (error) {
    console.error("Error fetching gold price:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching gold price, circuit breaker engaged." });
  }
});

app.listen(port, () => {
  console.log(
    `Gold Price API is running on http://localhost:${port}/api/gold-price`
  );
});