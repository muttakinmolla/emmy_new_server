const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const port = process.env.PORT || 5000;
const app = express();

// middleware =============================
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9mm1y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })




async function run() {
    try {

        const categoryCollection = client.db('bikePicker').collection('categories');
        const usersCollection = client.db('bikePicker').collection('users');


        // create user api =====================================================
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);

        });


        // add category api====================
        app.post('/addCategory', async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.log());

app.get('/', async (req, res) => {
    res.send('bike pickers server is running')
})
app.listen(port, () => console.log(`bike pickers running On: ${port}`))