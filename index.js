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


// function verifyJwt(req, res, next) {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         return res.status(401).send('unauthorized access')
//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
//         if (error) {
//             return res.status(403).send({ message: 'forbidden Access' })
//         }
//         req.decoded = decoded
//         next();
//     })

// }

async function run() {
    try {

        const usersCollection = client.db('bikePicker').collection('users');

        // const verifyAdmin = async (req, res, next) => {
        //     const decodedEmail = req.decoded.email;
        //     const query = { email: decodedEmail };
        //     const user = await usersCollection.findOne(query);

        //     if (user?.role !== 'admin') {
        //         return res.status(403).send({ message: 'forbidden access' });
        //     }
        //     next()
        // }

        // app.get('/jwt', async (req, res) => {
        //     const email = req.query.email;
        //     const query = { email: email };
        //     const user = await usersCollection.findOne(query);
        //     if (user) {
        //         const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
        //         return res.send({ accessToken: token });
        //     }
        //     console.log(user)
        //     res.status(403).send({ accessToken: '' })
        // })



        // create user api =====================================================
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);

        });

    }
    finally {

    }
}
run().catch(console.log());

app.get('/', async (req, res) => {
    res.send('doctor portal server is running')
})
app.listen(port, () => console.log(`doctors portal running On: ${port}`))