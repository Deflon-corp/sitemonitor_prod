import React, { useState, useEffect } from "react";

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      if (isNaN(target.getTime())) return "Invalid date";
      const difference = target - new Date();

      if (difference <= 0) {
        return "Scanning soon...";
      }

      const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((difference / (1000 * 60 * 60 * 24)) % 30);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let parts = [];
      if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
      if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

      const timeParts = [
        `${hours.toString().padStart(2, "0")} hr`,
        `${minutes.toString().padStart(2, "0")} min`,
        `${seconds.toString().padStart(2, "0")} sec`,
      ];

      const dateStr = parts.join(" ");
      const timeStr = timeParts.join(" : ");

      return dateStr ? `${dateStr} : ${timeStr}` : timeStr;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;

  return <span className="fw-medium">{timeLeft}</span>;
};

export default CountdownTimer;
