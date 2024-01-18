import axios from "axios"
import React, { FormEvent, useState, useEffect, CSSProperties } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { setAuthenticated } from './../authActions';

export const SecuredPage = () => {
	const { executeRecaptcha } = useGoogleReCaptcha();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [submitStatus, setSubmitStatus] = useState('')
	const [recaptchaReady, setRecaptchaReady] = useState(false);
	const [message, setMessage] = useState('');
	const [formData, setFormData] = useState({
		nativeName: '',
		lastName: '',
		email: ''
	  });
	 
	  useEffect(() => {
		if (executeRecaptcha) {
		  setRecaptchaReady(true);
		}
	  }, [executeRecaptcha]);

	  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
		const { name, value } = e.target;
		setFormData(prevState => ({
		  ...prevState,
		  [name]: value
		}));
	  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitStatus('');

    if (!executeRecaptcha) {
      console.log("not available to execute recaptcha")
      return;
    }

    const gRecaptchaToken = await executeRecaptcha('securePageSubmission');

    try {
		const response = await axios.post('/verify-recaptcha', { token: gRecaptchaToken, formData });
  
	  if (response?.data?.success === true) {
		  console.log('ReCaptcha Verified: ', response?.data);
			console.log(`Success with score: ${response?.data?.score}`);
		  dispatch(setAuthenticated(true));
		  setSubmitStatus('ReCaptcha Verified. Access Granted to Secured Page.');
	  } else {
		console.log(`Failure with score: ${response?.data?.score}`);
		setSubmitStatus("Failed to verify recaptcha on Secure page! You must be a robot!")
	  }
  } catch (error) {
		  console.error('Error submitting reCAPTCHA', error);
		  setSubmitStatus('Error verifying reCAPTCHA.');
	  }
	}
  
	return (
	<div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Recaptcha (V3) Sample - Secure Page</h1>
            <form style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }} onSubmit={handleSubmit}>
                <input type='text' name='nativeName' placeholder='Native Name' style={inputStyle} value={formData.nativeName} onChange={handleInputChange}/>
                <input type='text' name='lastName' placeholder='Last Name' style={inputStyle} value={formData.lastName} onChange={handleInputChange}/>
                <input type='email' name='email' placeholder='Email' style={inputStyle} value={formData.email} onChange={handleInputChange}/>
                <input type="submit" style={submitButtonStyle} />
            </form>
            {submitStatus && <p style={{ textAlign: 'center', marginTop: '20px' }}>{submitStatus}</p>}
        </div>
    );
}

const inputStyle = {
    border: '1px solid #ccc',
    padding: '10px 15px',
    borderRadius: '5px',
    width: '300px'
};

const submitButtonStyle: CSSProperties = {
    border: 'none',
    padding: '10px 15px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#4CAF50',
    color: 'white'
};