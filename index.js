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


function verifyJwt(req, res, next) {
    console.log('inside_token:', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'forbidden Access' })
        }
        req.decoded = decoded
        next();
    })

}


async function run() {
    try {

        const categoryCollection = client.db('bikePicker').collection('categories');
        const usersCollection = client.db('bikePicker').collection('users');
        const productsCollection = client.db('bikePicker').collection('products');
        const wishlistCollection = client.db('bikePicker').collection('wishlist');
        const orderCollection = client.db('bikePicker').collection('orders');
        const reportCollection = client.db('bikePicker').collection('reports');


        // jwt web token ========================================
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
                return res.send({ accessToken: token })
            }
            console.log(user);
            res.status(403).send({ accessToken: ' ' });
        });


        // verify admin function ====================================
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.userType !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next()
        }


        // create user api =====================================================
        app.post('/users', async (req, res) => {
            const user = req.body;
            const email = { email: user.email }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/allUsers', verifyJwt, async (req, res) => {

            const allUsers = {};
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query);

            if (user?.userType !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const users = await usersCollection.find(allUsers).toArray();
            res.send(users);
        });

        app.get('/verifiedUser/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const userEmail = { email: email };
            const result = await usersCollection.findOne(userEmail);
            res.send(result);
        })

        app.put('/allUser/verify/:id', verifyJwt, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    isVerified: 'verify'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        // for user type checking ==================================
        // users admin or not api =======================================================
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({
                isAdmin: user?.userType === 'admin',
                isBuyer: user?.userType === 'buyer',
                isSeller: user?.userType === 'seller'
            });
        });


        // delete data ====================================================================================
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        });


        // category get Api ==========================
        app.get('/categories', async (req, res) => {
            const query = {};
            const category = await categoryCollection.find(query).toArray();
            res.send(category)
        })

        // add category api====================
        app.post('/addCategory', async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.send(result);
        });


        // add product api ===============================
        app.post('/addProduct', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        // get product api =============================
        app.get('/allProduct', verifyJwt, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });


        // get all product api for buyer ========================================
        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })

        // get product by id =====================================
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const product = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(product);
            res.send(result);
        })

        // get product by Category ===========================================
        app.get('/products/category/:id', async (req, res) => {
            const id = req.params.id;

            const category = { category: id }

            const products = await productsCollection.find(category).toArray();
            res.send(products);
        });

        // wishlist post api ===================================================
        app.post('/wishlist', async (req, res) => {
            const product = req.body;
            const result = await wishlistCollection.insertOne(product);
            res.send(result);
        })

        // wishlist get api ====================================
        app.get('/wishlist', verifyJwt, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                res.status(403).send({ message: 'forbidden access' })
            }
            const query = { userEmail: email };
            const products = await wishlistCollection.find(query).toArray();
            res.send(products);
        });

        // order post api ============================================
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // order get api ====================================
        app.get('/order', verifyJwt, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                res.status(403).send({ message: 'forbidden access' })
            }
            const query = { buyer_email: email };
            const products = await orderCollection.find(query).toArray();
            res.send(products);
        });

        //  report product api ======================================
        app.post('/report', async (req, res) => {
            const product = req.body;
            const result = await reportCollection.insertOne(product);
            res.send(result);
        });

        // report get api for admin only ===============================
        app.get('/report', verifyJwt, verifyAdmin, async (req, res) => {

            const query = {};
            const products = await reportCollection.find(query).toArray();
            res.send(products);
        });

        // get Buyer api ============================================
        app.get('/buyer', verifyJwt, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                res.status(403).send({ message: 'forbidden access' })
            }
            const query = { seller_email: email };
            const products = await orderCollection.find(query).toArray();
            res.send(products);
        });

        // product status update api ==============================
        app.put('/product/status/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'sold'
                }
            }
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

    }
    finally {

    }
}
run().catch(console.log());

app.get('/', async (req, res) => {
    res.send('bike pickers server is running')
})
app.listen(port, () => console.log(`bike pickers running On: ${port}`))