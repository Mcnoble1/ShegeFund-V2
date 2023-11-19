import React, { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import { Web5 } from "@web5/api/browser";
import { webcrypto } from 'node:crypto';
// import { useNavigate } from 'react-router-dom'; 
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import "../../styles/index.css";


// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const Create = () => {

  const [web5, setWeb5] = useState(null);
  const [myDid, setMyDid] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);
    const [recipientDid, setRecipientDid] = useState("");
    const [didCopied, setDidCopied] = useState(false);
    const [campaigns, setCampaigns] = useState([]);

    const [cause, setCause] = useState<{ creatorDid: string, title: string, name: string, target: string, deadline: string, description: string, image: File | null }>({
        title: "",
        name: "",
        target: "",
        deadline: "",
        description: "",
        image: null,
        creatorDid: "",
    });

  useEffect(() => {
    const initWeb5 = async () => {
      const { web5, did } = await Web5.connect();
      setWeb5(web5);
      console.log(web5)
      setMyDid(did);
      console.log(myDid)

      if (web5 && did) {
        await configureProtocol(web5);
        await fetchCampaigns(web5, did);
      }
    };
    initWeb5();
  }, []);
    
    

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

          const file = e.target.files?.[0];
            
          if ( name === 'target') {
            // Use a regular expression to allow only phone numbers starting with a plus
            const phoneRegex = /^[+]?[0-9\b]+$/;
              
            if (!value.match(phoneRegex) && value !== '') {
              // If the input value doesn't match the regex and it's not an empty string, do not update the state
              return;
            }
          } else if (name === 'name' || name === 'title' || name === 'description') {
            // Use a regular expression to allow only letters and spaces
            const letterRegex = /^[A-Za-z\s]+$/;
            if (!value.match(letterRegex) && value !== '') {
              // If the input value doesn't match the regex and it's not an empty string, do not update the state
              return;
            }
          }
      
      
        setCause((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      };


      const createCause = async (cause) => {
        const { record } = await web5.dwn.records.write({
            data: cause,
            message: {
                protocol: "https://shegefund.com/fundraise-protocol",
                protocolPath: "cause",
                schema: "https://shegefund.com/cause",
                dataFormat: 'application/json',
                recipient: recipientDid,
            },
        });
        console.log("Create cause record", record);
        return record;
      };
    
      const sendRecord = async (record) => {
        return await record.send(recipientDid);
      };
      
        
        const handleCreateCause = async (e: FormEvent) => {
          e.preventDefault();
      
        // Validate the form fields
        const requiredFields = ['title', 'name', 'target', 'deadline', 'description', 'image'];
        const emptyFields = requiredFields.filter((field) => !cause[field]);
        
        if (emptyFields.length > 0) {
            toast.error('Please fill in all required fields.', {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 3000, // Adjust the duration as needed
            });
            
            requiredFields.forEach((field) => {
            if (!cause[field]) {
                // Find the corresponding input element and add the error class
                const inputElement = document.querySelector(`[name="${field}"]`);
                if (inputElement) {
                inputElement.parentElement?.classList.add('error-outline');
                }
            }
            });
        
            return; // Prevent form submission
        }

        // Get the recipient DID from the URL
        // const creatordid = localStorage.getItem('did');
        
        setLoading(true); 

        // Create a Cause object
          const formdata = new FormData();
          formdata.append('title', cause.title);
          formdata.append('name', cause.name);
          formdata.append('target', cause.target);
          formdata.append('deadline', cause.deadline);
          formdata.append('description', cause.description);
          formdata.append('creatorDid', myDid)
          formdata.append("image", fileInputRef.current.files[0], fileInputRef.current.files[0].name);
      
      
          try {
            // Send the cause object to the dwn
           const record = await createCause(formdata);
            console.log(record);
            const { status } = await sendRecord(record);

            console.log("Send record status", status);

            await fetchCampaigns(web5, myDid);

            if (status.code !== 200) {
              toast.error('Failed to send the cause record.', {
                position: toast.POSITION.TOP_RIGHT,
                autoClose: 3000, // Adjust the duration as needed
              });
              return;
            }

            toast.success('Cause created successfully.', {
              position: toast.POSITION.TOP_RIGHT,
              autoClose: 3000, // Adjust the duration as needed
            });

            setLoading(false);

            // Clear the form
            setCause({
                title: "",
                name: "",
                target: "",
                deadline: "",
                description: "",
                image: null,
                creatorDid: "",
            });
      
            // reload the page 
            }
            catch (error) {
              console.log(error);
            }
       };
      
  const configureProtocol = async (web5) => {
    const fundraiseProtocolDefinition = {
        protocol: "https://shegefund.com/fundraise-protocol",
        published: true,
        types: {
            campaign: {
                schema: "https://shegefund.com/campaign",
                dataFormats: ["application/json"],
            },
            donation: {
                schema: "https://shegefund.com/donation",
                dataFormats: ["application/json"],
              },
        },
        structure: {
            campaign: {
                $actions: [
                    {who: "author", can: "write"},
                    {who: "anyone", can: "read"},
                ],
            },
            donation: {
                $actions: [
                    {who: "anyone", can: "write"},
                    {who: "anyone", can: "read"},
                ],
            },
        },
    };
    
    const { protocols, status: protocolStatus } =
      await web5.dwn.protocols.query({
        message: {
          filter: {
            protocol: "https://shegefund.com/fundraise-protocol",
          },
        },
      });
    
    if (protocolStatus.code !== 200 || protocols.length === 0) {
      const { protocolStatus } = await web5.dwn.protocols.configure({
        message: {
          definition: fundraiseProtocolDefinition,
        },
      });
      console.log("Configure protocol status", protocolStatus);
    };
  };


  const fetchCampaigns = async (web5, did) => {
    const { records, status: recordStatus } = await web5.dwn.records.query({
      message: {
        filter: {
          protocol: "https://shegefund.com/fundraise-protocol",
          protocolPath: "cause",
        },
        dateSort: "createdAscending",
      },
    });
    
    console.log(records);
    try {
      const results = await Promise.all(
        records.map(async (record) => record.data.json())
      );
    
      if (recordStatus.code == 200) {
        const received = results.filter((result) => result?.recipient === myDid);
        setCampaigns(received);
        console.log(received)
      }
    } catch (error) {
      console.error(error);
    }  };
    
    return (
      <section id="contact" className="overflow-hidden py-16 md:py-20 lg:py-28">
        <div className="container">
          <div className="-mx-4 flex flex-wrap justify-center">
            <div className="w-full px-4 lg:w-7/12 xl:w-8/12">
              <div
                className="wow fadeInUp mb-12 rounded-md bg-primary/[3%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
                data-wow-delay=".15s
                "
              >
                <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                  Create a Fundraising Cause
                </h2>
                <p className="mb-12 text-base font-medium text-body-color">
                  Tell your story and raise funds for your cause.
                </p>
                <form>
                  <div className="-mx-4 flex flex-wrap">
                    <div className="w-full px-4 md:w-1/2">
                      <div className="mb-8">
                        <label
                          htmlFor="title"
                          className="mb-3 block text-sm font-medium text-dark dark:text-white"
                        >
                          Title
                        </label>
                        <div>
                        <input
                          type="text"
                          name="title"
                          value={cause.title}
                          onChange={handleInputChange}
                          placeholder="5 shegs/sec"
                          required
                          className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                        />
                        </div>
                      </div>
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <div className="mb-8">
                        <label
                          htmlFor="name"
                          className="mb-3 block text-sm font-medium text-dark dark:text-white"
                        >
                          Your Name
                        </label>
                        <div>
                        <input
                          type="text"
                          name="name"
                          value={cause.name}
                          onChange={handleInputChange}
                          required
                          placeholder="Festus Idowu"
                          className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                        />
                        </div>
                      </div>
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <div className="mb-8">
                        <label
                          htmlFor="target"
                          className="mb-3 block text-sm font-medium text-dark dark:text-white"
                        >
                          Target
                        </label>
                        <div>
                        <input
                          type="text"
                            name="target"
                            value={cause.target}
                            onChange={handleInputChange}
                            required
                          placeholder="100 USD"
                          className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                        />
                        </div>
                      </div>
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <div className="mb-8">
                        <label
                          htmlFor="deadline"
                          className="mb-3 block text-sm font-medium text-dark dark:text-white"
                        >
                          Deadline
                        </label>
                         <div>
                        <input
                          type="date"
                            name="deadline"
                            value={cause.deadline}
                            onChange={handleInputChange}
                            required
                          placeholder="31-01-2024"
                          className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                        />
                        </div>
                      </div>
                    </div>
                    <div className="w-full px-4">
                      <div className="mb-8">
                        <label
                          htmlFor="description"
                          className="mb-3 block text-sm font-medium text-dark dark:text-white"
                        >
                          Your Shege Story
                        </label>
                        <div>
                        <textarea
                          name="description"
                          rows={4}
                            value={cause.description}
                            onChange={handleInputChange}
                            required
                          placeholder="Describe your shege story"
                          className="w-full resize-none rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                        ></textarea>
                        </div>
                      </div>
                    </div>
                    <div className="w-full px-4 md:w-1/2">
                      <div className="mb-8">
                        <label
                          htmlFor="image"
                          className="mb-3 block text-sm font-medium text-dark dark:text-white"
                        >
                          Cover Image
                        </label>
                        <div>
                        <input
                          type="file"
                            name="image"
                            value={cause.image}
                            onChange={handleInputChange}
                            ref={fileInputRef}
                            required
                            placeholder="Upload an image"
                          className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                        />
                        </div>
                      </div>
                    </div>
                    <div className="w-full px-4">
                      <button 
                        type="button"
                        onClick={handleCreateCause}
                        disabled={loading}
                        className="rounded-md bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                         {loading ? (
                          <div className="flex items-center">
                            <div className="spinner"></div>
                            <span className="pl-1">Creating...</span>
                          </div>
                        ) : (
                          <>Create</>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  export default Create;
  