const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rwhf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        // jobs related api
        const jobsCollection = client.db("jobportal").collection("jobs");
        const jobApplicationCollection = client.db("jobportal").collection("job_applications");

        // create jobs
        app.post("/jobs", async (req, res) => {
            const job = req.body;
            const result = await jobsCollection.insertOne(job);
            res.send(result);
        })

        // read jobs data
        app.get("/jobs", async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { hr_email: email }
            }

            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // read single job data
        app.get("/jobs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query);
            res.send(result);
        })

        // create job application collection
        app.post("/job-applications", async (req, res) => {
            const application = req.body;
            const result = await jobApplicationCollection.insertOne(application);
            res.send(result);
        })

        // find applicant job data by email
        app.get("/job-applications", async (req, res) => {
            const email = req.query.email;
            const query = { applicant_email: email };
            const result = await jobApplicationCollection.find(query).toArray();

            // optional way to find
            for (const application of result) {
                const query = { _id: new ObjectId(application.job_id) };
                const result = await jobsCollection.findOne(query);
                if (result) {
                    application.title = result.title;
                    application.company = result.company;
                    application.company_logo = result.company_logo;
                }
            }
            res.send(result);
        })

        // delete applicant data
        app.delete("/job-applications/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const job = await jobApplicationCollection.deleteOne(query);
            res.send(job);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Server is runing....")
})

app.listen(port, () => {
    console.log(`Server is runing on port: ${port}`);
})