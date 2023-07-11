const express=require('express');
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const cors=require('cors');
const nodemailer = require('nodemailer');
const {generateRandomString} =require('./generateRandom')
const dotenv=require('dotenv');
dotenv.config()

const app=express()
app.use(cors());
// Add body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Connect to MongoDB Atlas
mongoose.connect(`mongodb+srv://admin:iXatwYMuvUwaIeMd@cluster0.jvegpfy.mongodb.net/${process.env.MONGODB_DATABASE_NAME}?retryWrites=true&w=majority
`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user:`${process.env.EMAIL}`,
      pass: `${process.env.EPASSWORD}`,
    },
  });
  

// Define MongoDB schema and models for Mentor and Student
const loginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
      },
      useremail: {
        type: String,
        required: true,
        unique: true, // Ensures uniqueness of the email field
      },
      password: {
        type: String,
        required: true,
      },
      resetToken:String,
      newPassword:String,
      shortUrl:[String],
  
}, { collection: `${process.env.COLLECTION}` }); // Specify the collection name
const Login= mongoose.model('Login', loginSchema);
// post method

// sign up
app.post("/createUsers", async (request, response, next) => {
    const { username, useremail, password } = request.body;
    
    /**
     * CHECKING WHETHER USER ALREADY HAVE ACCOUNT WITH US
     */
  
    const userExistingData = await Login.findOne({
      useremail:useremail
    });
    if (userExistingData?._id) {
      return response.status(409).json({
        success: false,
        message: "User account already exists",
      });
    } else {
      //CONSTRUCTING NEW SIGNUP OBJECT
      const newUser = new Login({
        username: username,
        useremail:useremail,        
        password: password,
      });
      // TRYING TO SAVE USER IN DATABASE
      newUser
        .save()
        .then((res) => {
          if (res._id) {
            response.status(200).json({
              success: true,
              message: "Account created successfully!!!",
              data: res,
            });
          } else {
            response.status(500).json({
              success: false,
              message: "Something went wrong internally!!!",
              data: res,
            });
          }
        })
        .catch((error) => {
          return response.status(400).json({
            success: false,
            message: "Bad Request!!!",
            error: error,
          });
        });
    }
  });
 
  // sign in 
app.post("/checkUser",async(req,response,next)=>{
    const{useremail,password}=req.body;
    const userExistingData = await Login.findOne({
        useremail:useremail
      });
      if(userExistingData?._id)
      {
        const match= (password===userExistingData.password)
        if(match)
        {
            return response.status(200).json({
                success: true,
                message: "Logged in successfully!!!",
              });
        }
        else{
            return response.status(401).json({
                success: false,
                message: "EmailId or Password is In-correct!!!",
              });
        }
      }
      else{
        return response.status(404).json({
            success: false,
            message: "User account doesnt exists, create new account!!!",
          });
      }

})
// forgot password
// send token 
app.post('/requestPasswordReset',async (req, res) => {
    const { useremail } = req.body;
  console.log(useremail)
    // Check if the email exists in the MongoDB collection
    const user = await Login.findOne({ useremail });
    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }
  
     // Generate a random token
     const token = generateRandomString(10);
     console.log(token);  // Output: "7bT3cD1rL9"
     
  
    // Save the token to the database
  await Login.findOneAndUpdate({ useremail }, { resetToken: token }, { new: true, upsert: true });

  // Compose the email
  const mailOptions = {
    from: `${process.env.EMAIL}`,
    to: useremail,
    subject: 'Password Reset',
    text: `Your random string: ${token}`,
  };

  // Send the email with the random string
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Failed to send the random string.' });
    }
    console.log('Email sent: ' + info.response);
    res.status(200).json({ message: 'Random string sent successfully to the email address.' });
  });
  });
  // check token and email
app.post('/reset-password', async (req, res) => {
    const { useremail, resetToken, newPassword } = req.body;
  
    try {
      // Find the user with the matching email and token
      const user = await Login.findOne({ useremail, resetToken: resetToken });
  
      if (!user) {
        return res.status(404).json({ error: 'Invalid email or token.' });
      }
  
      // Update the user's password
      user.password = newPassword;
      user.resetToken = null; // Remove the reset token from the user document
      await user.save();
  
      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  });
// store url
app.post('/shortUrl',async(req,res)=>{
  try{
    const {useremail,shortenedUrl}=req.body
  const userExistingData = await Login.findOne({
    useremail:useremail
  });
  if(userExistingData?._id)
      {
        userExistingData.shortUrl.push(shortenedUrl);
        const savedData = await userExistingData.save();
        res.status(200).json({ message: 'Data updated successfully',savedData });
      }
      else{
        return res.status(404).json({
          success: false,
          message: "User account doesnt exists, create new account!!!",
        });
      }
  }
  catch(error)
  {
    console.error('Error updating data in MongoDB:', error);
    res.status(500).json({ error: 'Error updating data in MongoDB' });
  }
})
// using get method retrieve generated short url
app.get('/viewshortUrl/:useremail', async(req,res)=>{
  try {
    const { useremail } = req.params;
    const userExistingData = await Login.findOne({
      useremail:useremail
    });
    if(userExistingData?._id)
      {
        const shortUrls = userExistingData.shortUrl;
        res.status(200).json( shortUrls );
      }
      else{
        return res.status(404).json({
          success: false,
          message: "User account doesnt exists, create new account!!!",
        });
      }
  }
  catch(error)
  {
    console.error('Error updating data in MongoDB:', error);
    res.status(500).json({ error: 'Error updating data in MongoDB' });
  }
})
const port=process.env.PORT
app.listen(port,()=>{
 console.log("Server started on port",port)
})