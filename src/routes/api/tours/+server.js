// src/routes/api/tours/+server.js

import { json } from "@sveltejs/kit";
import fs from "fs/promises";
import path from "path";

// Define the file path where the data will be stored
const dataFilePath = path.resolve("data/tours.json"); // Adjust path if necessary

export const GET = async () => {
  try {
    // Read the data from the file
    const data = await fs.readFile(dataFilePath, "utf8");
    return json(JSON.parse(data));
  } catch (error) {
    // If the file doesn't exist or cannot be read, return an error
    return json({ error: "Failed to load data" }, { status: 500 });
  }
};

export const POST = async ({ request }) => {
  try {
    // Get the data sent in the POST request
    const data = await request.json();
    // Write the data to the file
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
    return json({ message: "Data saved successfully" });
  } catch (error) {
    // Return an error if saving fails
    return json({ error: "Failed to save data" }, { status: 500 });
  }
};
