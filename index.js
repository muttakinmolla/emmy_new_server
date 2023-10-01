const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const port = process.env.PORT || 5000;
const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
})
const upload = multer({ storage: storage });


// middleware =============================
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const myProfileCollection = client.db('emmy_canada').collection('my_profile');
        const myProjectCollection = client.db('emmy_canada').collection('projects');
        const myCategoryCollection = client.db('emmy_canada').collection('category');
        const myUploadCollection = client.db('emmy_canada').collection('upload');
        const mySettingsCollection = client.db('emmy_canada').collection('setting');

        // Authentication API

        // verify admin function ====================================
        const verifyAdmin = async (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).json({ error: "Not Authorized" });
            }

            // Bearer token
            const authHeader = req.headers.authorization;
            const token = authHeader.split(" ")[1];

            try {
                // Verify the token is valid
                const { user } = jwt.verify(token, process.env.JWT_SECRET);
                next();
            } catch (error) {
                return res.status(401).json({ error: "Not Authorized" });
            }
        }

        // login
        app.post('/login', (req, res) => {
            const { email, password } = req.body;
            if (email == "emitooo852@gmail.com" && password == "admin1234") {
                const token = jwt.sign({ user: "admin" }, process.env.JWT_SECRET);
                return res.send({ accessToken: token });
            } else {
                return res
                    .status(401)
                    .json({ message: "The username and password your provided are invalid" });
            }
        });

        // logout
        app.get('/logout', verifyAdmin, (req, res) => {
            return res.send({ message: 'Logout Successfull!' });
        });

        // profile save routes=======================================================================
        app.put('/myProfile', verifyAdmin, upload.single('thumbnail'), async (req, res) => {
            console.log(req.file)
            let info = req.body;
            const collection = await myProfileCollection.find({}).toArray();
            if (collection.length > 0) {
                const filter = { _id: new ObjectId(collection[0]._id) };
                if (req.file) {
                    info.thumbnail = `uploads/${req.file.filename}`;
                    const data = await myProfileCollection.find(filter).toArray();
                    if (data[0].thumbnail) {
                        fs.unlink(data[0].thumbnail, (e) => { console.log(e) });
                    }
                }
                const options = { upsert: true };
                const updateDoc = {
                    $set: info,
                }
                const result = await myProfileCollection.updateOne(filter, updateDoc, options);
                res.send(result);
            } else {
                if (req.file) {
                    info.thumbnail = `uploads/${req.file.filename}`;
                }
                const result = await myProfileCollection.insertOne(info);
                res.send(result);
            }
        });

        // profile get routes=======================================================================
        app.get('/myProfile', async (req, res) => {
            const collection = await myProfileCollection.find({}).toArray();
            const id = new ObjectId(collection[0]._id);
            const profiles = await myProfileCollection.findOne(id);
            res.send(profiles);
        });

        // projects get routes=======================================================================
        app.get('/projects', async (req, res) => {
            const info = req.body;
            const result = await myProjectCollection.find({}).toArray();
            res.send(result);
        });


        // projects save routes=======================================================================
        app.post('/myProjects', verifyAdmin, async (req, res) => {
            const info = req.body;
            const result = await myProjectCollection.insertOne(info);
            res.send(result);
        });

        // projects edit routes=======================================================================
        app.get('/myProjects/:id', async (req, res) => {
            const id = req.params.id;
            const project = new ObjectId(id);

            const projects = await myProjectCollection.find(project).toArray();
            res.send(projects);
        });

        // projects update routes=======================================================================
        app.put('/myProject/update/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const info = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: info,
            }
            const result = await myProjectCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        // project delete data ====================================================================================
        app.delete('/myProject/delete/:id', verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await myProjectCollection.deleteOne(query);
            res.send(result)
        });


        // categories get routes=======================================================================
        app.get('/myCategory', async (req, res) => {
            const result = await myCategoryCollection.find({}).toArray();
            res.send(result);
        });


        // category save routes=======================================================================
        app.post('/myCategory', verifyAdmin, async (req, res) => {
            const info = req.body;
            const result = await myCategoryCollection.insertOne(info);
            res.send(result);
            console.log(result);
        });


        // category edit routes=======================================================================
        app.get('/myCategory/:id', async (req, res) => {
            const id = req.params.id;
            const project = new ObjectId(id);

            const projects = await myCategoryCollection.find(project).toArray();
            res.send(projects);
        });

        // projects update routes=======================================================================

        app.put('/myCategory/update/:id', verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const info = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: info,
            }
            const result = await myCategoryCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        // category delete data ====================================================================================
        app.delete('/myCategory/delete/:id', verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await myCategoryCollection.deleteOne(query);
            res.send(result)
        });


        // uploads get routes=======================================================================
        app.get('/myuploads', async (req, res) => {
            const result = await myUploadCollection.find({}).toArray();
            res.send(result);
        });


        // uploads save routes=======================================================================
        app.post('/myuploads', verifyAdmin, upload.single('thumbnail'), async (req, res) => {
            const info = req.body;
            info.thumbnail = `uploads/${req.file.filename}`;
            const result = await myUploadCollection.insertOne(info);
            res.send(result);
        });


        // uploads edit routes=======================================================================
        app.get('/category/uploads/:name', async (req, res) => {
            const name = req.params.name;
            const filter = { category: name };
            const projects = await myUploadCollection.find(filter).toArray();
            res.send(projects);
        });

        // uploads update routes=======================================================================
        app.put('/myuploads/update/:id', verifyAdmin, upload.single('thumbnail'), async (req, res) => {
            const id = req.params.id;
            const info = req.body;
            const filter = { _id: new ObjectId(id) };
            if (req.file) {
                info.thumbnail = `uploads/${req.file.filename}`;
                const data = await myUploadCollection.find(filter).toArray();
                if (data.thumbnail) {
                    fs.unlink(data.thumbnail, (e) => { console.log(e) });
                }
            }
            const options = { upsert: true };
            const updateDoc = {
                $set: info,
            }
            const result = await myUploadCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


        // uploads delete data ====================================================================================
        app.delete('/myuploads/delete/:id', verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const data = await myUploadCollection.find(query).toArray();
            if (data[0].thumbnail) {
                fs.unlink(data[0].thumbnail, (e) => { console.log(e) });
            }
            const result = await myUploadCollection.deleteOne(query);
            res.send(result)
        });


        // settings save routes=======================================================================
        app.put('/pagesettings', verifyAdmin, upload.single('thumbnail'), async (req, res) => {
            let info = req.body;
            const collection = await mySettingsCollection.find({}).toArray();
            if (collection.length > 0) {
                const filter = { _id: new ObjectId(collection[0]._id) };
                if (req.file) {
                    info.thumbnail = `uploads/${req.file.filename}`;
                    const data = await mySettingsCollection.find(filter).toArray();
                    if (data[0].thumbnail) {
                        fs.unlink(data[0].thumbnail, (e) => { console.log(e) });
                    }
                }
                const options = { upsert: true };
                const updateDoc = {
                    $set: info,
                }
                const result = await mySettingsCollection.updateOne(filter, updateDoc, options);
                res.send(result);
            } else {
                if (req.file) {
                    info.thumbnail = `uploads/${req.file.filename}`;
                }
                const result = await mySettingsCollection.insertOne(info);
                res.send(result);
            }
        });

        // settings get routes=======================================================================
        app.get('/pagesettings', async (req, res) => {
            const collection = await mySettingsCollection.find({}).toArray();
            if (collection.length > 0) {
                const id = new ObjectId(collection[0]._id);
                const profiles = await mySettingsCollection.findOne(id);
                res.send(profiles);
            }
        });


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.log());

app.get('/', async (req, res) => {
    res.send('bike pickers server is running')
})
app.listen(port, () => console.log(`emmy server running On: ${port}`))