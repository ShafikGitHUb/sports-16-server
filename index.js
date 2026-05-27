const express = require("express");
const dotenv = require("dotenv")
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config()
const uri = process.env.MONGODB_URI
const app = express();
const port = process.env.PORT
app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
)

const verifyToken =async(req,res,next)=>{
const authHeader = req?.headers.authorization
if(!authHeader){
  return res.status(401).json({message:"Unauthorized"});
}
const token = authHeader.split(" ")[1];
if(!token){
  return res.status(401).json({message:"Unauthorized"});
}
try{
  const {payload} = await jwtVerify(token,JWKS)
  
next()
}
catch(error){
  return res.status(403).json({message: "Forbidden"});
}
}

async function run() {
  try {
    await client.connect();

//create database
const db = client.db("sports")
const facilityCollection = db.collection("facilities")
//booking information collection
const bookingInformationCollection = db.collection("bookinginformation")
//review information collection
const reviewCollection = db.collection("reviews");


//get method allfacility data add here
app.get("/all-facilities", async(req,res)=>{
  const result = await facilityCollection.find().toArray()
  res.send(result)
})


//add allfacilitydetails server get method
app.get("/all-facilities/:id",verifyToken, async(req,res)=>{
  const {id} = req.params
  const result = await facilityCollection.findOne({_id: new ObjectId(id)})
  res.send(result)   
})


//addfacility server post method
app.post("/add-facility", async (req, res) => {
  const newFacility = req.body;
  const result = await facilityCollection.insertOne(newFacility);
  res.send(result);
});

//booking information

app.post("/booking" , async(req,res) =>{
  const bookingInformation = req.body;
  const result = await bookingInformationCollection.insertOne(bookingInformation);
  res.send(result);
})

//my booking get method here
app.get("/booking/:userId", async(req, res) =>{
  const {userId} = req.params;
  const result = await bookingInformationCollection.find({userId: userId}).toArray();
  res.send(result)
})

//booking delete
app.delete("/booking/:bookingId", async(req, res) =>{
  const {bookingId} = req.params;
  const result = await bookingInformationCollection.deleteOne({_id: new ObjectId(bookingId)})
  res.send(result)
})


//review get method 
app.get("/reviews", async (req, res) => {
  const result = await reviewCollection.find().toArray();
  res.send(result);
});

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Sports16 Server Running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

