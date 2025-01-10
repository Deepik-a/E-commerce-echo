const userSchema = require("../../model/userSchema");
const addressSchema = require("../../model/addressSchema");

//-------------------------------------------Rendering  profile Page----------------------------------------------

const profile = async (req, res) => {
  try {
    console.log("profile login through google auth:", req.session.user); // Debugging session
  

    const userId = req.session.user;
    const userDetail = await userSchema.findById(userId);
    const index = req.params.index; 

    if (!userId) {
      return res.redirect("/login");
    }
    if (!userDetail) {
      return res.redirect("/");
    }
     const fromCheckout = req.query.from === "checkout"
   
    res.render("user/userprofile", { userDetail ,index, fromCheckout });
  } catch (error) {
    console.log(`Error during profile page render ${error}`);
    res.status(404);
  }
};


//------------------------------------------- update profile(Only name and phone) ----------------------------------------------
// Backend check for Google-authenticated users (already included)
const updatedProfile = async (req, res) => {
  try {
    const userDetail = await userSchema.findById(req.session.user);
    
    // Check if the user is logged in via Google
    if (userDetail.authMethod === 'google') {
      return res.redirect(`/userprofile?status=error&message=You cannot edit your profile when logged in via Google authentication.`);
    }
    
    const { name, phone } = req.body;
    
    // Update the profile if not a Google-authenticated user
    const profileUpdate = await userSchema.findByIdAndUpdate(req.session.user, { name, phone });
    
    if (profileUpdate) {
      res.redirect(`/userprofile?status=success&message=Profile updated successfully`);
    } else {
      res.redirect(`/userprofile?status=error&message=Could not update profile, please try again`);
    }
  } catch (error) {
    console.log(`Error during updating the user profile: ${error}`);
    res.redirect(`/userprofile?status=error&message=An error occurred. Please try again later.`);
  }
};



//------------------------------- Add address management-----------------------------

const addAddress = async (req, res) => {
  try {
    const userAddress = {
      building: req.body.building,
      street: req.body.street,
      city: req.body.city,
      phone: req.body.phone,
      pincode: req.body.pincode,
      landmark: req.body.landmark,
      state: req.body.state,
      country: req.body.country,
    };

    const user = await userSchema.findById(req.session.user);
    user.address.push(userAddress);
    await user.save();

    console.log("success", "Address added");

    res.redirect("/userprofile");
  } catch (error) {
    req.flash("error", "Error while adding new address, please try later");
    console.log(`Error during adding the user address: ${error}`);
    res.redirect("/userprofile"); // Redirect to handle error
  }
};

//-------------------------------------- Remove Address ---------------------------------

const removeAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const index = parseInt(req.params.index, 10);

    const user = await userSchema.findById(userId);

    if (!user) {
      console.log("User not found");
      req.flash("error", "User not found");
      return res.redirect("/userprofile");
    }

    if (isNaN(index) || index < 0 || index >= user.address.length) {
      req.flash("error", "Invalid address index");
      return res.redirect("/userprofile");
    }

    user.address.splice(index, 1); // Remove the address
    await user.save();

    console.log("Address deleted successfully");
    req.flash("success", "Address deleted successfully");

    // Redirect to the profile page after successful deletion
    res.redirect("/userprofile");
  } catch (error) {
    console.log(`Error during address deletion: ${error}`);
    req.flash("error", "Failed to delete address. Please try again later.");
    res.redirect("/userprofile");
  }
};


// --------------------------------------- Edit address page load ---------------------------------

const editAddress = async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10); // Get the index from the URL parameter
    console.log(index,"index of address");
    const user = await userSchema.findById(req.session.user); // Fetch the user from the database

    // Ensure the index is valid
    if (index < 0 || index >= user.address.length) {
      req.flash("error", "Invalid address index.");
      return res.redirect("/userprofile"); // Redirect to user profile if index is invalid
    }

    // Get the updated address details from the request body
    const updatedAddress = {
      building: req.body.building,
      street: req.body.street,
      city: req.body.city,
      phone: req.body.phone,
      pincode: req.body.pincode,
      landmark: req.body.landmark,
      state: req.body.state,
      country: req.body.country,
    };

    // Update the specified address in the user's address array
    user.address[index] = updatedAddress;

    // Save the user with the updated address
    await user.save();

    req.flash("success", "Address updated successfully.");
    res.redirect("/userprofile"); // Redirect to user profile after successful update
  } catch (error) {
    req.flash("error", "Error while updating the address. Please try again later.");
    console.log(`Error during updating the user address: ${error}`);
    res.redirect("/userprofile"); // Redirect to user profile on error
  }
};








module.exports = {
  profile,
  updatedProfile,
  addAddress,
  removeAddress,
  editAddress
};
