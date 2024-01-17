import axios from "axios"
import React, { FormEvent, useState, useEffect } from "react"
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

	//   useEffect(() => {
    //     const checkAuthentication = async () => {
    //         try {
    //             const response = await axios.get('/validate-jwt');
    //             if (!response.data.isAuthenticated) {
    //                 navigate('/login'); // Redirect to login if not authenticated
    //             } else {
    //                 // Fetch secure content if authenticated
    //                 const secureContent = await axios.get('/secure');
    //                 setMessage(secureContent.data);
    //             }
    //         } catch (error) {
    //             console.error('Error checking authentication', error);
    //             navigate('/login');
    //         }
    //     };

    //     checkAuthentication();
    // }, [navigate]);

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
	  console.log('response:', response);
  
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
    <div>
      <h1 className='text-xl text-center'>Recaptcha (V3) Sample - Secure Page</h1>
      <br />
      <form className='flex flex-col justify-start items-center gap-4' onSubmit={handleSubmit}>
	  	<input type='text' name='nativeName' placeholder='Native Name' className="border p-4 rounded"  value={formData.nativeName} onChange={handleInputChange}/>
        <input type='text' name='lastName' placeholder='Last Name' className="border p-4 rounded"  value={formData.lastName} onChange={handleInputChange}/>
        <input type='email' name='email' placeholder='Email' className="border p-4 rounded"  value={formData.email} onChange={handleInputChange}/>
        <input type="submit" className="border p-4 text-lg rounded bg-blue-500" />
      </form>
      {submitStatus && submitStatus && <p className="text-lg text-center">{submitStatus}</p>}
    </div>
  )
}