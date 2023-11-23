import React, { useEffect, useRef, useState, ChangeEvent, FormEvent } from "react";
import useWeb5 from '../../hooks/useWeb5';  
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import "../../styles/index.css";

const Donate = () => {

  const [loading, setLoading] = useState<boolean>(false);
    const [recipientDid, setRecipientDid] = useState("");
    const [didCopied, setDidCopied] = useState(false);
    const [donations, setDonations] = useState([]);
    const [fetchLoading, setFetchLoading] = useState<boolean>(false);
    const [campaigns, setCampaigns] = useState([]);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    
    const { web5, myDid } = useWeb5();

    useEffect(() => {
      const configure = async () => {
      if (web5 && myDid) {
        await configureProtocol(web5, myDid);
      }
    };
    configure();
  }, [myDid, web5]);


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


  
    const donateProtocolDefinition = () => {
      return {
        protocol: "https://shegefund.com/donate-protocol",
        published: true,
        types: {
            donate: {
                schema: "https://shegefund.com/donateSchema",
                dataFormats: ["application/json"],
              },
        },
        structure: {
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
    
  const configureProtocol = async (web5, did) => {
    const protocolDefinition = donateProtocolDefinition();
    const protocolUrl = protocolDefinition.protocol;

    const { protocols: localProtocols, status: localProtocolStatus } = await queryLocalProtocol(web5, protocolUrl);
    if (localProtocolStatus.code !== 200 || localProtocols.length === 0) {
      const result = await installLocalProtocol(web5, protocolDefinition);
      console.log({ result })
      console.log("Donate Protocol installed locally");
    }

    const { protocols: remoteProtocols, status: remoteProtocolStatus } = await queryRemoteProtocol(web5, did, protocolUrl);
    if (remoteProtocolStatus.code !== 200 || remoteProtocols.length === 0) {
      const result = await installRemoteProtocol(web5, did, protocolDefinition);
      console.log({ result })
      console.log("Donate Protocol installed remotely");
    }  
  };
  



  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
          
        if ( name === 'amount') {
          // Use a regular expression to allow only phone numbers starting with a plus
          const phoneRegex = /^[+]?[0-9\b]+$/;
            
          if (!value.match(phoneRegex) && value !== '') {
            // If the input value doesn't match the regex and it's not an empty string, do not update the state
            return;
          }
        } else if (name === 'name') {
          // Use a regular expression to allow only letters and spaces
          const letterRegex = /^[A-Za-z\s]+$/;
          if (!value.match(letterRegex) && value !== '') {
            // If the input value doesn't match the regex and it's not an empty string, do not update the state
            return;
          }
        }

      if (name === 'amount') {
          setAmount(value);
      } else if (name === 'name') {
          setName(value);
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
    const donateProtocol = donateProtocolDefinition();
    const { record, status } = await web5.dwn.records.write({
      data: donationData,
      message: {
          protocol: donateProtocol.protocol,
          protocolPath: "donate",
          schema: donateProtocol.types.donate.schema,
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

    const handleCopyDid = () => {
      navigator.clipboard.writeText(myDid);
      setDidCopied(true);
      setTimeout(() => {
        setDidCopied(false);
      }, 3000);
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

  const fetchCampaigns = async () => {
    setFetchLoading(true);
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
  
    if (response.status.code === 200) {
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
      setFetchLoading(false);
      return publicCampaigns;
    } else {
      setFetchLoading(false);
      console.error('Error fetching public campaigns:', response.status);
      return [];
    } 
    } catch (error) {
      setFetchLoading(false);
      console.error('Error in fetchPublicCampaigns:', error);
    }
  };
      
    
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
                  Donate to a Fundraising Cause
                </h2>
                <p className="mb-12 text-base font-medium text-body-color">
                  Spread Love and help someone out
                </p>
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
            <div className="w-full px-4 lg:w-5/12 xl:w-4/12">
              <div className="wow fadeInUp mb-12 rounded-md bg-primary/[3%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]" data-wow-delay=".15s">
                <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                  Your DID
                </h2>
                <p className="mb-12 text-base font-medium text-body-color">
                  Your Decentralized Identifier (DID) is your unique digital identity on the Shege Fund network. Copy your DID and share with your friends and family to start receiving donations.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={myDid}
                    readOnly
                    className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                  />
                  <button
                    onClick={handleCopyDid}
                    className="absolute right-0 top-0 h-full px-6 py-3 bg-primary rounded-md dark:bg-white dark:text-black"
                  >
                    {didCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="wow fadeInUp mb-12 rounded-md bg-primary/[3%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]" data-wow-delay=".15s">
                <h2 className="mb-3 text-2xl font-bold text-black dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
                 Campaigns in Need of Donations
                </h2>
                <p className="mb-12 text-base font-medium text-body-color">
                  View and manage your campaigns.
                </p>
                <div className="w-full px-4">
                      <button 
                        type="button"
                        onClick={fetchCampaigns}                        
                        disabled={fetchLoading}
                        className="rounded-md bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
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
                <div className="relative">
                  {campaigns.length > 0 ? (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign.recordId}
                          className="flex items-center justify-between px-4 py-3 bg-white rounded-md shadow-one dark:bg-[#242B51]"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                              {campaign.name[0]}
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No campaigns found
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
  
  export default Donate;
  














