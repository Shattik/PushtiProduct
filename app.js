const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const axios = require('axios');
const PORT = process.env.port;
const supabase = require('./db.js');

app.use(express.json());
app.use(cors({ origin: "*" }));

app.listen(PORT, async () => {
    console.log(`Listening on port ${PORT}`);

    try {
        let serviceRegisterUrl = String(process.env.serviceRegistryUrl) + "/register";
    
        await axios.post(serviceRegisterUrl, {
          name: process.env.selfName,
          url: process.env.selfUrl,
        });
        console.log("Service registered successfully");
      } catch (error) {
        console.error("Failed to register service:", error);
        process.exit(1);
      }
});

const deregisterService = async () => {
    try {
      let serviceRegisterUrl =
        String(process.env.serviceRegistryUrl) + "/deregister";
      await axios.post(serviceRegisterUrl, { name: process.env.selfName });
      console.log("Service de-registered successfully");
    } catch (error) {
      console.log("Failed to de-register service:", error);
      process.exit(1);
    }
  };

const gracefulShutdown = async () => {
    await deregisterService();
    process.exit(0);
};

app.post('/inventory', async (req, res) => {
    
    try {
        const {user_id} = req.body;
        let id = await supabase.any(`SELECT "id", "name", "unit", "unitPrice", "imageLink", "amount" From "Product", "Inventory" WHERE "id" = "productId" AND "unionId" = (SELECT "unionId" FROM "User" WHERE "id" = $1)`, [user_id]);
        res.json(id);
    }
    catch (err) {
        console.log(err);
        const response = {
            error: "Error: Internal server error",
        };
        res.status(400).send(response);
    }

});

app.get('/product', async (req, res) => {
    try {
        let id = await supabase.any(`SELECT * From "Product"`);
        res.json(id);
    }
    catch (err) {
        console.log(err);
        const response = {
            error: "Error: Internal server error",
        };
        res.status(400).send(response);
    }
});

app.post('/product/update', async (req, res) => {
    try {
        const {id, unit_price, tax_amount} = req.body;
        await supabase.any(`UPDATE "Product" SET "unitPrice" = $1, "taxPercentage" = $2 WHERE "id" = $3`, [unit_price, tax_amount, id]);
        const response = {
            success: true
        };
        res.json(response);
    }
    catch (err) {
        console.log(err);
        const response = {
            error: "Error: Internal server error",
        };
        res.status(400).send(response);
    }
});

app.post('/product/add', async (req, res) => {
    try {
        const {name, unit, unit_price, tax_amount, image_link} = req.body;
        let idInfo = await supabase.any(`INSERT INTO "Product" ("name", "unit", "unitPrice", "taxPercentage", "imageLink") VALUES ($1, $2, $3, $4, $5) returning "id"`, [name, unit, unit_price, tax_amount, image_link]);
        const response = {
            success: true,
            id: idInfo[0].id
        };
        res.json(response);
    }
    catch (err) {
        console.log(err);
        const response = {
            error: "Error: Product already exists",
        };
        res.status(400).send(response);
    }
});

process.on('SIGTERM', gracefulShutdown); // For termination signal
process.on('SIGINT', gracefulShutdown); // For interrupt signal
process.on('uncaughtException', gracefulShutdown); // For uncaught exceptions