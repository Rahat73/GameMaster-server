const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


//middlewares
app.use(cors());
app.use(express.json());   // used for converting data to json during post

// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oahoku5.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('GameMaster').collection('services');
        const reviewsCollection = client.db('GameMaster').collection('reviews');


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
            res.send({ token })
        })

        ///////////////////////////SERVICE COLLECTION////////////////////////////
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/serviceBanner', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query).limit(3);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/serviceDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const serviceDetails = await serviceCollection.findOne(query);
            // console.log(serviceDetails, query);
            res.send(serviceDetails);
        })

        app.post('/addService', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })


        //////////////////////REVIEW COLLECTION//////////////////////////
        app.post('/review', async (req, res) => {
            const review = req.body;
            const d = new Date();
            review.date = d;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        })

        app.get('/reviews/:serviceId', async (req, res) => {
            const id = req.params.serviceId;
            const query = { serviceID: id };
            const sort = { date: -1 };
            const cursor = reviewsCollection.find(query).sort(sort);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.get('/myReviews/:userId', verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            console.log('here', decoded);

            // if (decoded.email !== req.query.email) {
            //     res.status(403).send({ message: 'unauthorized access' })
            // }

            const id = req.params.userId;
            const query = { userID: id };
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.get('/updateReview/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewsCollection.findOne(query);
            res.send(review);
        })

        app.get('/updateReview/', async (req, res) => {
            updateReview = JSON.parse('{"updateReview":"Wanna update review ?"}');
            res.send(updateReview);
            //api for empty id of updateReview bcz at 1st no id is given when useEffect executes
        })

        app.delete('/myReviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewsCollection.deleteOne(query);
            res.send(result);
        })

        app.put('/updateReview/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const review = req.body;
            const option = { upsert: true }
            const updatedReview = {
                $set: {
                    reviewDesc: review.reviewDesc,
                    reviewRate: review.reviewRate
                }
            }
            const result = await reviewsCollection.updateOne(filter, updatedReview, option);
            res.send(result);
        })
    }
    finally {

    }
}

run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('GameMaster server is running...')
})

app.listen(port, () => {
    console.log(`GameMaster server is running on port: ${port}`);
})