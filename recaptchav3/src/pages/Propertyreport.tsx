import axios from "axios"
import React, { FormEvent, useState, useEffect } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { setAuthenticated } from './../authActions';

export const PropertyReport = () => {
	const { executeRecaptcha } = useGoogleReCaptcha();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [submitStatus, setSubmitStatus] = useState('')
	const [recaptchaReady, setRecaptchaReady] = useState(false);
	const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated); // Assuming your state shape
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: ''
	  });
	  

	useEffect(() => {
		if (executeRecaptcha) {
		  setRecaptchaReady(true);
		}
	  }, [executeRecaptcha]);

	  useEffect(() => {
        if (isAuthenticated) {
            navigate('/secure');
        }
    }, [isAuthenticated, navigate]);

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
	console.log('e', e)
    if (!executeRecaptcha) {
      console.log("recaptcha hasn't run")
      return;
    }

	//token to verify api recaptcha is properly set up and for analytics 
    const gRecaptchaToken = await executeRecaptcha('propertyReportSubmission');

	try {
      const response = await axios.post('/verify-recaptcha', { token: gRecaptchaToken, formData });
	console.log('response:', response);

    if (response?.data?.success === true) {
		console.log('ReCaptcha Verified: ', response?.data);
      	console.log(`Success with score: ${response?.data?.score}`);
		dispatch(setAuthenticated(true));
		setSubmitStatus('ReCaptcha Verified. Access Granted to Secured Page.');
		navigate('/secure'); // Navigate to the secured page on success
    } else {
      console.log(`Failure with score: ${response?.data?.score}`);
      setSubmitStatus("Failed to verify recaptcha on PropertyPage! You must be a robot!")
    }
} catch (error) {
		console.error('Error submitting reCAPTCHA', error);
		setSubmitStatus('Error verifying reCAPTCHA.');
	}
  }

  return (
    <div>
      <h1 className='text-xl text-center'>Recaptcha (V3) Sample - Property report page</h1>
      <br />
      <form className='flex flex-col justify-start items-center gap-4' onSubmit={handleSubmit}>
        <input type='text' name='firstName' placeholder='First Name' className="border p-4 rounded"  value={formData.firstName} onChange={handleInputChange}/>
        <input type='text' name='lastName' placeholder='Last Name' className="border p-4 rounded"  value={formData.lastName} onChange={handleInputChange}/>
        <input type='email' name='email' placeholder='Email' className="border p-4 rounded"  value={formData.email} onChange={handleInputChange}/>
        <input type="submit" className="border p-4 text-lg rounded bg-blue-500" />
      </form>
      {submitStatus && submitStatus && <p className="text-lg text-center">{submitStatus}</p>}
    </div>
  )
}