const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  rollNumber: {
    type: String,
    sparse: true, // Only for students
    unique: true
  },
  department: {
    type: String,
    trim: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Middleware: Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt (random data added to password)
    const salt = await bcrypt.genSalt(10);
    
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method: Compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method: Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Virtual: Get full user info for response (without sensitive data)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;