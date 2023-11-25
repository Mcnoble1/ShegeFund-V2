import React, { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import useWeb5 from '../../hooks/useWeb5';  // Adjust the path based on your project structure
// import { useNavigate } from 'react-router-dom'; 
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import "../../styles/index.css";

const Dashboard = () => {

  const [loading, setLoading] = useState<boolean>(false);
  const [donationLoading, setDonationLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
    const [recipientDid, setRecipientDid] = useState("");
    const [didCopied, setDidCopied] = useState(false);
    const [campaignType, setCampaignType] = useState("personal");
    const [campaigns, setCampaigns] = useState([]);
    const [donations, setDonations] = useState([]);
    const [submitStatus, setSubmitStatus] = useState("");
    const [amount, setAmount] = useState("");
    const [title, setTitle] = useState("");
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [deadline, setDeadline] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [createPopupOpen, setCreatePopupOpen] = useState(false);
    const [donatePopupOpen, setDonatePopupOpen] = useState(false);

  let pc = [];

    const { web5, myDid } = useWeb5();

    useEffect(() => {
      const configure = async () => {
      if (web5 && myDid) {
        await configureProtocol(web5, myDid);
      }
    };
    configure();
  }, [myDid, web5]);

  // const fileInputRef = useRef<HTMLInputElement | "">(""); 
  
  const trigger = useRef<HTMLButtonElement | null>(null);
  const popup = useRef<HTMLDivElement | null>(null);

  const queryLocalProtocol = async (web5, protocolUrl) => {
    return await web5.dwn.protocols.query({
      message: {
        filter: {
          protocol: protocolUrl,
        },
      },
    });
  };


  const queryRemoteProtocol = async (web5, did, protocolUrl) => {
    return await web5.dwn.protocols.query({
      from: did,
      message: {
        filter: {
          protocol: protocolUrl,
        },
      },
    });
  };

  const installLocalProtocol = async (web5, protocolDefinition) => {
    return await web5.dwn.protocols.configure({
      message: {
        definition: protocolDefinition,
      },
    });
  };

  const installRemoteProtocol = async (web5, did, protocolDefinition) => {
    const { protocol } = await web5.dwn.protocols.configure({
      message: {
        definition: protocolDefinition,
      },
    });
    return await protocol.send(did);
  };


  
    const fundraiseProtocolDefinition = () => {
      return {
        protocol: "https://shegefund.com/fundraise-protocol",
        published: true,
        types: {
            personalCause: {
                schema: "https://shegefund.com/personalCauseSchema",
                dataFormats: ["application/json"],
            },
            directCause: {
              schema: "https://shegefund.com/directCauseSchema",
              dataFormats: ["application/json"],
          },
            donate: {
                schema: "https://shegefund.com/donateSchema",
                dataFormats: ["application/json"],
              },
        },
        structure: {
            personalCause: {
                $actions: [
                    {who: "anyone", can: "write"},
                    { who: "author", of: "personalCause", can: "read" },
                ],
            },
            directCause: {
              $actions: [
                  {who: "anyone", can: "write"},
                  { who: "author", of: "directCause", can: "read" },
                  { who: "recipient", of: "directCause", can: "read" },
              ],
            },
            donate: {
              $actions: [ 
                  {who: "anyone", can: "write"},
                  { who: "author", of: "donate", can: "read" },
                  { who: "recipient", of: "donate", can: "read" },
              ],
          },
        },
    };
  };
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const configureProtocol = async (web5, did) => {
    const protocolDefinition = fundraiseProtocolDefinition();
    const protocolUrl = protocolDefinition.protocol;

    const { protocols: localProtocols, status: localProtocolStatus } = await queryLocalProtocol(web5, protocolUrl);
    if (localProtocolStatus.code !== 200 || localProtocols.length === 0) {
      const result = await installLocalProtocol(web5, protocolDefinition);
      console.log({ result })
      console.log("Fundraise Protocol installed locally");
    } else {
      console.log(localProtocols, "Fundraise Protocol already installed locally");
      }

    const { protocols: remoteProtocols, status: remoteProtocolStatus } = await queryRemoteProtocol(web5, did, protocolUrl);
    if (remoteProtocolStatus.code !== 200 || remoteProtocols.length === 0) {
      const result = await installRemoteProtocol(web5, did, protocolDefinition);
      console.log({ result })
      console.log("Fundraise Protocol installed remotely");
    }  else {
      console.log(remoteProtocols, "Fundraise Protocol already installed remotely");
      }
  };
  


    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
            
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

        if (name === 'title') {
            setTitle(value);
        } else if (name === 'name') {
            setName(value);
        } else if (name === 'target') {
            setTarget(value);
        } else if (name === 'deadline') {
            setDeadline(value);
        } else if (name === 'description') {
            setDescription(value);
        }
      
      };

        // Create a mixed record and 
  const writeSecretCauseToDwn = async (title: string, name: string, target: string, description: string, deadline: string, image: File) => {
    let base64Image = null;

    if (image) {
      const reader = new FileReader();
      // Use a promise to handle the asynchronous read operation
      const readImage = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        // Read the image file as a Blob
        reader.readAsDataURL(new Blob([image]));
      });
    
      try {
        const dataUrl = await readImage;
        base64Image = dataUrl.split(',')[1];
      } catch (error) {
        console.error('Error reading image file:', error);
        throw error;
      }
    }

    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    const campaignData = {
      title: title,
      name: name,
      timestamp: `${currentDate} ${currentTime}`,
      sender: myDid, 
      type: 'personal',
      target: target,
      description: description,
      deadline: deadline,
      image: base64Image
    };

    try {
    const fundraiseProtocol = fundraiseProtocolDefinition();
    const { record, status } = await web5.dwn.records.write({
      data: campaignData,
      message: {
          protocol: fundraiseProtocol.protocol,
          protocolPath: "personalCause",
          schema: fundraiseProtocol.types.personalCause.schema,
          recipient: myDid,
      },
    });

    if (status.code === 200) {
      return { ...campaignData, recordId: record.id };
    }

    console.log("Personal Campaign Data written to DWN", { record, status });
      return record;
  } catch (error) {
    console.error('Error writing campaign data to DWN', error);
  }
};


const writeDirectCauseToDwn = async (title: string, name: string, target: string, description: string, deadline: string, image: File, recipientDid: string ) => {
  let base64Image = null;

  if (image) {
    console.log(image)
    const reader = new FileReader();
    // Use a promise to handle the asynchronous read operation
    const readImage = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      // Read the image file as a Blob
      reader.readAsDataURL(new Blob([image]));
    });
  
    try {
      const dataUrl = await readImage;
      base64Image = dataUrl.split(',')[1];
    } catch (error) {
      console.error('Error reading image file:', error);
      throw error;
    }
  }

  console.log(base64Image);

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();


  const campaignData = {
    title: title,
    name: name,
    target: target,
    timestamp: `${currentDate} ${currentTime}`,
    sender: myDid, 
    type: 'public', 
    description: description,
    deadline: deadline,
    image: base64Image,
    recipientDid: recipientDid
  };

  try {
  const fundraiseProtocol = fundraiseProtocolDefinition();
  const { record, status } = await web5.dwn.records.write({
    data: campaignData,
    message: {
        protocol: fundraiseProtocol.protocol,
        protocolPath: "directCause",
        schema: fundraiseProtocol.types.directCause.schema,
        recipient: campaignData.recipientDid,
    },
  });

  if (status.code === 200) {
    return { ...campaignData, recordId: record.id };
  }

  console.log("Direct Campaign Data written to DWN", { record, status });
    return record;
} catch (error) {
  console.error('Error writing direct campaign data to DWN', error);
}
};
      
  const handleCreateCause = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Submitting message...');
    setSubmitStatus('Submitting...');
    setLoading(true); 

  const requiredFields = ['title', 'name', 'target', 'deadline', 'description', 'image'];
  const emptyFields = requiredFields.filter((field) => ![field]);

  if (emptyFields.length > 0) {
      toast.error('Please fill in all required fields.', {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, // Adjust the duration as needed
      });
      
      requiredFields.forEach((field) => {
      if (![field]) {
          // Find the corresponding input element and add the error class
          const inputElement = document.querySelector(`[name="${field}"]`);
          if (inputElement) {
          inputElement.parentElement?.classList.add('error-outline');
          }
      }
      });
      return; // Prevent form submission
    }

    try {
      const targetDid = campaignType === 'personal' ? myDid : recipientDid;
      let record;

      if (campaignType === 'personal') {
        record = await writeSecretCauseToDwn(title, name, target, description, deadline, image,);
      } else {
        record = await writeDirectCauseToDwn(title, name, target, description, deadline, image, targetDid);
      }

      if (record) {
        const { status } = await record.send(targetDid);
        console.log("Send record status in handleCreateCause", status);
        setSubmitStatus('Message submitted successfully');
        await fetchCampaigns();
      } else {
        throw new Error('Failed to create record');
      }
    
      setTitle("");
      setName("");
      setTarget("");
      setDeadline("");
      setDescription("");
      setImage("");
      setRecipientDid("");
      
      toast.success('Cause created successfully.', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, // Adjust the duration as needed
      });

      setLoading(false);
      }
      catch (error) {
        console.error('Error in handleCreateCause', error);
        setSubmitStatus('Error submitting message: ' + error.message);
        setLoading(false);
      }
  };

  const fetchPersonalCampaigns = async (web5) => {
    console.log('Fetching personal campaigns...');
    try {
    const { records } = await web5.dwn.records.query({
      from: myDid,
      message: {
        filter: {
          protocol: "https://shegefund.com/fundraise-protocol",
          schema: "https://shegefund.com/personalCauseSchema",
        },
      },
    });

    console.log("Saved records", records);

    for (let record of records) {
      const data = await record.data.json();
      const list = {record, data, id: record.id};
      pc.push(list);
  }

  console.log("Personal Campaigns:", pc);
    // console.log(response);
    // console.log(response.status.code);
    // if (response.status.code === 200) {
    //   const personalCampaigns = await Promise.all(
    //     response.records.map(async (record) => {
    //       const data = await record.data.json();
    //       console.log('Personal Campaigns:', data);
    //       return {
    //         ...data, 
    //         recordId: record.id 
    //       };
    //     })
    //   );
    //   return personalCampaigns;
    // } else {
    //   console.error('Error fetching personal campaigns:', response.status);
    //   return [];
    // }
  } catch (error) {
    console.error('Error in fetchCampaigns:', error);
  }
};


const fetchPublicCampaigns = async (web5) => {
  console.log('Fetching public campaigns...');
  try {
  const response = await web5.dwn.records.query({
    message: {
      filter: {
        protocol: "https://shegefund.com/fundraise-protocol",
      },
    },
  });
  console.log(response);
  console.log(response.status.code);
  console.log(response.records);
  if (response?.status?.code === 200) {
    const publicCampaigns = await Promise.all(
      response.records.map(async (record) => {
        const data = await record.data.json();
        console.log('Public Campaigns:', data);
        return {
          ...data, 
          recordId: record.id 
        };
      })
    );
    return publicCampaigns;
  } else {
    console.error('Error fetching public campaigns:', response.status);
    return [];
  } 
  } catch (error) {
    console.error('Error in fetchPublicCampaigns:', error);
  }
};

const fetchCampaigns = async () => {
  setFetchLoading(true);
  console.log('Fetching campaigns...');
  try {
    const personalCampaigns = await fetchPersonalCampaigns(web5);
    const publicCampaigns = await fetchPublicCampaigns(web5);
    
    // const campaigns = [...personalCampaigns, ...publicCampaigns]; // Assign the merged campaigns to the 'campaigns' variable
    
    if (!Array.isArray(personalCampaigns) || !Array.isArray(publicCampaigns)) {
      throw new Error('Invalid campaign data');
    }
    
    const campaigns = [...personalCampaigns, ...publicCampaigns];
    setCampaigns(campaigns);
    console.log('Campaigns:', campaigns);
    setFetchLoading(false);
  } catch (error) {
    console.error('Error in fetchCampaigns:', error);
    setFetchLoading(false);
  }
}

const handleCopyDid = async () => {
  if (myDid) {
    try {
      await navigator.clipboard.writeText(myDid);
      setDidCopied(true);
      setTimeout(() => {
        setDidCopied(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to copy DID: " + err);
    }
  }
};


const deleteCampaign = async (recordId) => {
  try {
    const response = await web5.dwn.records.query({
      message: {
        filter: {
          recordId: recordId,
        },
      },
    });

    if (response.records && response.records.length > 0) {
      const record = response.records[0];
      const deleteResult = await record.delete();

      if (deleteResult.status.code === 202) {
        console.log('Campaign deleted successfully');
        setCampaigns(prevCampaigns => prevCampaigns.filter(message => message.recordId !== recordId));
      } else {
        console.error('Error deleting message:', deleteResult.status);
      }
    } else {
      console.error('No record found with the specified ID');
    }
  } catch (error) {
    console.error('Error in deleteCampaign:', error);
  }
};
    

const updateCampaign = async (recordId, data) => {
  try {
    const response = await web5.dwn.records.query({
      message: {
        filter: {
          recordId: recordId,
        },
      },
    });

    if (response.records && response.records.length > 0) {
      const record = response.records[0];
      const updateResult = await record.update(data);

      if (updateResult.status.code === 202) {
        console.log('Campaign updated successfully');
        setCampaigns(prevCampaigns => prevCampaigns.map(message => message.recordId === recordId ? { ...message, ...data } : message));
      } else {
        console.error('Error updating message:', updateResult.status);
      }
    } else {
      console.error('No record found with the specified ID');
    }
  } catch (error) {
    console.error('Error in updateCampaign:', error);
  }
};


const writeDonationToDwn = async (name: string, amount: string, recipientDid: string) => {

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  const donationData = {
    name: name,
    amount: amount,
    timestamp: `${currentDate} ${currentTime}`,
    sender: myDid, 
  };

  try {
  const fundraiseProtocol = fundraiseProtocolDefinition();
  const { record, status } = await web5.dwn.records.write({
    data: donationData,
    message: {
        protocol: fundraiseProtocol.protocol,
        protocolPath: "donate",
        schema: fundraiseProtocol.types.donate.schema,
        recipient: recipientDid,
    },
  });

  if (status.code === 200) {
    return { ...donationData, recordId: record.id };
  }

  console.log("Donation Data written to DWN", { record, status });
    return record;
} catch (error) {
  console.error('Error writing donation data to DWN', error);
}
};


const handleDonation = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true); 
  console.log('Making a donation...');

// Validate the form fields
const requiredFields = ['name', 'amount'];
const emptyFields = requiredFields.filter((field) => ![field]);

if (emptyFields.length > 0) {
    toast.error('Please fill in all required fields.', {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000, // Adjust the duration as needed
    });
    
    requiredFields.forEach((field) => {
    if (![field]) {
        // Find the corresponding input element and add the error class
        const inputElement = document.querySelector(`[name="${field}"]`);
        if (inputElement) {
        inputElement.parentElement?.classList.add('error-outline');
        }
    }
    });

    return; // Prevent form submission
}


    try {
      let record;
      record = await writeDonationToDwn(name, amount, recipientDid);

      if (record) {
        const { status } = await record.send(recipientDid);
        console.log("Send record status in handleCreateCause", status);
        await fetchDonations();
      } else {
        throw new Error('Failed to create record');
      }
    
      setName("");
      setAmount("");
      
      setLoading(false);
      }
      catch (error) {
        console.error('Error in handleDonation', error);
        setLoading(false);
      }
  };

  const fetchDonations = async () => {
    console.log('Fetching donations from DWN')
    try {
    const response = await web5.dwn.records.query({
      message: {
        filter: {
          protocol: "https://shegefund.com/donate-protocol",
        },
      },
    });

    if (response.status.code === 200) {
      const donations = await Promise.all(
        response.records.map(async (record) => {
          const data = await record.data.json();
          return {
            ...data, 
            recordId: record.id 
          };
        })
      );
      return donations;
    } else {
      console.error('Error fetching donations:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error in fetchdonations:', error);
  }
};

const deleteDonation = async (recordId) => {
  try {
    const response = await web5.dwn.records.query({
      message: {
        filter: {
          recordId: recordId,
        },
      },
    });

    if (response.records && response.records.length > 0) {
      const record = response.records[0];
      const deleteResult = await record.delete();

      if (deleteResult.status.code === 202) {
        console.log('Donation deleted successfully');
        setDonations(prevDonations => prevDonations.filter(message => message.recordId !== recordId));
      } else {
        console.error('Error deleting message:', deleteResult.status);
      }
    } else {
      console.error('No record found with the specified ID');
    }
  } catch (error) {
    console.error('Error in deleteDonation:', error);
  }
};
    
    return (
      <section id="contact" className="overflow-hidden py-16 md:py-20 lg:py-10">
        <div className="container">
          <div className="-mx-4 flex flex-wrap justify-center">
          <div className="w-full px-4 lg:w-7/12 xl:w-8/12">
              <div
                className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] dark:bg-dark py-11 px-8 sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[30px]"
                data-wow-delay=".15s
                "
              >
                <h2 className="mb-3 text-2xl text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                  Your DID
                </h2>
                <p className="mb-3 text-base font-medium text-body-color">
                  Your Decentralized Identifier is your unique digital identity on the Shege Fund network.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={myDid}
                    readOnly
                    className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                  />
                  <button
                    onClick={handleCopyDid}
                    className="absolute right-0 top-0 h-full px-6 py-3 bg-primary rounded-lg dark:bg-white dark:text-black"
                  >
                    {didCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full px-4 lg:w-5/12 xl:w-4/12 flex flex-row gap-5">
              <button
                ref={trigger}
                onClick={() => setCreatePopupOpen(!createPopupOpen)}
                className="wow fadeInUp mb-12 text-2xl rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]">
                Create Cause
              </button>
              {createPopupOpen && (
                  <div
                    ref={popup}
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
                  >
                    <div
                      className="lg:mt-15 lg:w-1/2 rounded-lg shadow-md"
                      style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'scroll' }}
                    >              
                            <div
                              className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
                              data-wow-delay=".15s
                              "
                            >
                              <div className="flex justify-between">
                                <div>
                                  <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                                    Create a Fundraising Cause
                                  </h2>
                                  <p className="mb-12 text-base font-medium text-body-color">
                                    Tell your story and raise funds for your cause.
                                  </p>
                                </div>
                                
                                <div className="">
                              <button
                                onClick={() => setCreatePopupOpen(false)} 
                                className="text-blue-500 hover:text-gray-700 focus:outline-none"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 fill-current bg-primary rounded-full p-1 hover:bg-opacity-90"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="white"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                              
                             
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
                                        value={title}
                                        onChange={handleInputChange}
                                        placeholder="5 shegs/week for 1 year"
                                        required
                                        className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
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
                                        value={name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Festus Idowu"
                                        className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
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
                                          value={target}
                                          onChange={handleInputChange}
                                          required
                                        placeholder="100 USD"
                                        className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
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
                                          value={deadline}
                                          onChange={handleInputChange}
                                          required
                                        placeholder="31-01-2024"
                                        className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
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
                                          value={description}
                                          onChange={handleInputChange}
                                          required
                                        placeholder="Describe your shege story"
                                        className="w-full resize-none rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
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
                                          accept="image/*"
                                          name="image"
                                          onChange={(e) => {
                                            const selectedImage = e.target.files?.[0];
                                            setImage(selectedImage);
                                          }}
                                          required
                                          className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full px-4 md:w-1/2">
                                    <div className="mb-8">
                                      <label
                                        htmlFor="image"
                                        className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                      >
                                        Campaign Type
                                      </label>
                                      <div>
                                      <select
                                          className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                          value={campaignType}
                                          onChange={(e) => setCampaignType(e.target.value)}
                                        >
                                          <option value="personal">Personal</option>
                                          <option value="public">Public</option>
                                        </select>
                                          {campaignType === 'public' && (
                                          <input
                                            className="w-full mt-5 rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                            type="text"
                                            value={recipientDid}
                                            onChange={e => setRecipientDid(e.target.value)}
                                            placeholder="Enter recipient's DID"
                                          />
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full px-4">
                                    <button 
                                      type="button"
                                      onClick={handleCreateCause}
                                      disabled={loading}
                                      className="rounded-lg bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
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
                )}
                
              <button
                 ref={trigger}
                 onClick={() => setDonatePopupOpen(!donatePopupOpen)}
                className="wow fadeInUp mb-12 text-2xl rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]">
                  Make Donation
              </button>

              {donatePopupOpen && (
                  <div
                    ref={popup}
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
                  >
                    <div
                      className="lg:mt-15 lg:w-1/2 rounded-lg shadow-md"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                    >              
                            <div
                              className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
                              data-wow-delay=".15s
                              "
                            >
                              <div className="flex justify-between">
                                <div>
                                  <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                                    Make a Donation
                                  </h2>
                                  <p className="mb-12 text-base font-medium text-body-color">
                                    Donate to a cause.
                                  </p>
                                </div>
                                
                                <div className="">
                              <button
                                onClick={() => setDonatePopupOpen(false)} 
                                className="text-blue-500 hover:text-gray-700 focus:outline-none"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 fill-current bg-primary rounded-full p-1 hover:bg-opacity-90"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="white"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <form>
                          <div className="-mx-4 flex flex-wrap">
                          <div className="w-full px-4 ">
                              <div className="mb-8">
                                <label
                                  htmlFor="name"
                                  className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                >
                                  Recipient DID
                                </label>
                                <div>
                                <input
                                      className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                      type="text"
                                      value={recipientDid}
                                      onChange={e => setRecipientDid(e.target.value)}
                                      placeholder="Enter recipient's DID"
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
                                  value={name}
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
                                  htmlFor="title"
                                  className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                >
                                  Amount
                                </label>
                                <div>
                                <input
                                  type="text"
                                  name="amount"
                                  value={amount}
                                  onChange={handleInputChange}
                                  placeholder="100"
                                  required
                                  className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                />
                                </div>
                              </div>
                            </div>
                            <div className="w-full px-4">
                              <button 
                                type="button"
                                onClick={handleDonation}
                                disabled={loading}
                                className="rounded-md bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                                {loading ? (
                                  <div className="flex items-center">
                                    <div className="spinner"></div>
                                    <span className="pl-1">Donating...</span>
                                  </div>
                                ) : (
                                  <>Donate</>
                                )}
                              </button>
                            </div>
                          </div>
                          </form>
                            </div>
                    </div>
                  </div>
                )}
                             
                              
            </div>

            <div className="w-full px-4 lg:w-5/12 xl:w-6/12">
          
              <div className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]" data-wow-delay=".15s">
                <div className="flex flex-row justify-between">
                <div>
                  <h2 className="mb-3 text-2xl text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                    Your Campaigns
                  </h2>
                  <p className="mb-12 text-base font-medium text-body-color">
                    Manage your campaigns.
                  </p>
                </div>
                
                <div className="">
                      <button 
                        type="button"
                        onClick={fetchCampaigns}                        
                        disabled={fetchLoading}
                        className="rounded-lg bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                         {fetchLoading ? (
                          <div className="flex items-center">
                            <div className="spinner"></div>
                            <span className="pl-1">Fetching...</span>
                          </div>
                        ) : (
                          <>Fetch Campaigns</>
                        )}
                      </button>
                </div>
                </div>
                

                <div className="relative">
                  {campaigns.length > 0 ? (
                    <div className="space-y-4">
                      {campaigns.map((campaign, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-one dark:bg-[#242B51]"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                              {campaign.name}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-black dark:text-white">
                                {campaign.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.target}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.deadline}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.description}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.timestamp}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.type}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.recipientDid}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.sender}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {campaign.image}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => deleteCampaign(campaign.recordId)}
                              className="text-sm font-medium text-red-500 dark:text-red-400"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No campaigns yet
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full px-4 lg:w-5/12 xl:w-6/12">       
              <div className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]" data-wow-delay=".15s">
                <div className="flex flex-row justify-between">
                  <div className="">
                    <h2 className="mb-3 text-2xl text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                      Your Donations
                    </h2>
                    <p className="mb-12 text-base font-medium text-body-color">
                      Manage your donations.
                    </p>
                  </div>
                  <div className="">
                        <button 
                          type="button"
                          onClick={fetchDonations}                        
                          disabled={loading}
                          className="rounded-lg bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                          {loading ? (
                            <div className="flex items-center">
                              <div className="spinner"></div>
                              <span className="pl-1">Fetching...</span>
                            </div>
                          ) : (
                            <>Fetch Donations</>
                          )}
                        </button>
                  </div>
                </div>
               
                <div className="relative">
                  {donations.length > 0 ? (
                    <div className="space-y-4">
                      {donations.map((donation, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-one dark:bg-[#242B51]"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                              {donation.name}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-black dark:text-white">
                                {donation.amount}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {donation.timestamp}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {donation.recipientDid}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {donation.sender}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => deleteDonation(donation.recordId)}
                              className="text-sm font-medium text-red-500 dark:text-red-400"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No donations yet
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
          </div> 
        </div>
      </div>
      </section>
    );
  };
  
  export default Dashboard;
  












