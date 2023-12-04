import React, { useEffect, useRef, useState, ChangeEvent, FormEvent, useCallback } from "react";
// import useWeb5 from '../../hooks/useWeb5'; 
// import { useNavigate } from 'react-router-dom'; 
// import Image from "next/image";
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import "../../styles/index.css";
import { webcrypto } from 'node:crypto';
// @ts-ignore

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const Dashboard = () => {

  const [web5, setWeb5] = useState(null);
  const [myDid, setMyDid] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [getCampaignsLoading, setGetCampaignsLoading] = useState<boolean>(false);
  const [getDonationsLoading, setGetDonationsLoading] = useState<boolean>(false);
  const [shareLoading, setShareLoading] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [donationLoading, setDonationLoading] = useState(false)
    const [recipientDid, setRecipientDid] = useState('');
    const [didCopied, setDidCopied] = useState(false);
    const [campaignType, setCampaignType] = useState("Personal");
    const [campaigns, setCampaigns] = useState([]);
    // const [imageURLs, setImageURLs] = useState([]);
    const [donations, setDonations] = useState([]);
    const [amount, setAmount] = useState("");
    const [amountRaised, setAmountRaised] = useState(0);
    const [title, setTitle] = useState("");
    const [name, setName] = useState("");
    const [target, setTarget] = useState("");
    const [campaignTitle, setCampaignTitle] = useState("");
    const [deadline, setDeadline] = useState("");
    const [description, setDescription] = useState("");
    const [filterOption, setFilterOption] = useState<string>(''); 
    const [popupOpenMap, setPopupOpenMap] = useState<{ [key: number]: boolean }>({});
    const [isDeleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
    const [campaignToDeleteId, setCampaignToDeleteId] = useState<string | null>(null);
    const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);


    // const [imageDataURL, setImageDataURL] = useState<string | null>(null);

    const [createPopupOpen, setCreatePopupOpen] = useState(false);
    const [donatePopupOpen, setDonatePopupOpen] = useState(false);
    const [sharePopupOpen, setSharePopupOpen] = useState(false);

  useEffect(() => {

    const initWeb5 = async () => {
      // @ts-ignore
      const { Web5 } = await import('@web5/api/browser');
      
      try {
        const { web5, did } = await Web5.connect({ 
          sync: '5s', 
        });
        setWeb5(web5);
        setMyDid(did);
        console.log(web5);
        if (web5 && did) {
          console.log('Web5 initialized');
          toast.success('Web5 initialized successfully!', {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 3000, 
          });
          await configureProtocol(web5, did);
        }
      } catch (error) {
        console.error('Error initializing Web5:', error);
      }
    };

    initWeb5();
 
}, []);

// useEffect(() => {
//   return () => {
//     // Revoke the Blob URL to free up resources
//     URL.revokeObjectURL(imageURLs.map((imageURL) => imageURL));
//   };
// }, [imageURLs]);

  const fileInputRef = useRef<HTMLInputElement | null>(null); 
  // let imageData;

  let campaignWalletAmount = 0; 

  useEffect(() => {
    if (donatePopupOpen || createPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [donatePopupOpen, createPopupOpen]);
  
  const trigger = useRef<HTMLButtonElement | null>(null);
  const popup = useRef<HTMLDivElement | null>(null);  

  
  const togglePopup = (recordId: string) => {
    campaigns.map((campaign) => { 
      if (campaign.recordId === recordId) {
        setTitle(campaign.title);
        setName(campaign.name);
        setTarget(campaign.target);
        setDeadline(campaign.deadline);
        setDescription(campaign.description);
      }
    });
    setPopupOpenMap((prevMap) => ({
      ...prevMap,
      [recordId]: !prevMap[recordId],
    }));
  };

   // Function to close the popup for a specific campaign
   const closePopup = (recordId: string) => {
    setPopupOpenMap((prevMap) => ({
      ...prevMap,
      [recordId]: false,
    }));
  };

  const showDeleteConfirmation = (recordId: string) => {
    setCampaignToDeleteId(recordId);
    setDeleteConfirmationVisible(true);
  };

  const hideDeleteConfirmation = () => {
    setCampaignToDeleteId(null);
    setDeleteConfirmationVisible(false);
  };

  const toggleFilterDropdown = () => {
    setFilterDropdownVisible(!filterDropdownVisible);
  };

  const handleFilter = (option: string) => {
    let filteredCampaigns = [...campaigns];

    if (option === 'Personal') {
      filteredCampaigns = filteredCampaigns.filter((campaign) => campaign.type === 'Personal');
    } else if (option === 'Public') {
      filteredCampaigns = filteredCampaigns.filter((campaign) => campaign.type === 'Public');
    } else if (option === 'All') {
     fetchCampaigns();
    }

    setCampaigns(filteredCampaigns);
    setFilterOption(option);
    setFilterDropdownVisible(false);
  };



  // const handleImageInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //     const imageFile = event.target.files[0];
  //     const filereader = new FileReader();
  //     filereader.readAsArrayBuffer(imageFile);
  //     filereader.addEventListener('load', function () {
  //     imageData = filereader.result;
  //   })
  // };

  

  const shortenDID = (did, length) => {
    if (did.length <= length) {
      return did;
    } else {
      const start = did.substring(0, length);
      const end = '...';
      return start + end;
    }
  }

  const queryLocalProtocol = async (web5, url) => {
    return await web5.dwn.protocols.query({
      message: {
        filter: {
          protocol: "https://shege.xyz",
        },
      },
    });
  };


  const queryRemoteProtocol = async (web5, did, url) => {
    return await web5.dwn.protocols.query({
      from: did,
      message: {
        filter: {
          protocol: "https://shege.xyz",
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
        protocol: "https://shege.xyz",
        published: true,
        types: {
            personalCause: {
                schema: "https://shege.xyz/personalCauseSchema",
                dataFormats: ["application/json"],
            },
            directCause: {
              schema: "https://shege.xyz/directCauseSchema",
              dataFormats: ["application/json"],
            },
            image: {
              schema: "https://shege.xyz/imageSchema",
              dataFormats: ['image/jpg', 'image/png', 'image/jpeg', 'image/gif']
            },
            donate: {
                schema: "https://shege.xyz/donateSchema",
                dataFormats: ["application/json"],
              },
        },
        structure: {
            personalCause: {
                $actions: [
                    { who: "anyone", can: "write"},
                    { who: "author", of: "personalCause", can: "read" },
                  ],  
                },
              directCause: {
                $actions: [
                    { who: "author", of: "directCause", can: "read" },
                    { who: "recipient", of: "directCause", can: "read" },
                    { who: "anyone", can: "write" },
                ],
              },
              image: {
                $actions: [
                    { who: "author", of: "personalCause", can: "read" },
                    { who: "recipient", of: "personalCause", can: "read" },
                    { who: "anyone", can: "write" },
                ],
              },
            donate: {
              $actions: [ 
                  { who: "author", of: "donate", can: "read" },
                  { who: "recipient", of: "donate", can: "read" },
                  { who: "anyone", can: "write" },
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
      toast.success('Fundraise Protocol installed locally', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
    } else {
      toast.success('Fundraise Protocol already installed locally', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
      }

    const { protocols: remoteProtocols, status: remoteProtocolStatus } = await queryRemoteProtocol(web5, did, protocolUrl);
    if (remoteProtocolStatus.code !== 200 || remoteProtocols.length === 0) {
      const result = await installRemoteProtocol(web5, did, protocolDefinition);
      console.log({ result })
      toast.success('Fundraise Protocol installed remotely', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
    }  else {
      toast.success('Fundraise Protocol already installed remotely', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
      }
  };
  


    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
            
          if ( name === 'target') {
            // Use a regular expression to allow only phone numbers starting with a plus
            const numberRegex = /^[0-9\b]+$/;
              
            if (!value.match(numberRegex) && value !== '') {
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
  const writeSecretCauseToDwn = async (campaignData) => {

    try {
    const personalFundraiseProtocol = fundraiseProtocolDefinition();
    const { record, status } = await web5.dwn.records.write({
      data: campaignData,
      message: {
          protocol: personalFundraiseProtocol.protocol,
          protocolPath: "personalCause",
          schema: personalFundraiseProtocol.types.personalCause.schema,
          recipient: myDid,
      },
    });

    if (status.code === 200) {
      return { ...campaignData, recordId: record.id };
    }
    //  const conId = record.id;

    // if (imageData) {
    //   writeImageToDwn(imageData);
    // }

    toast.success('Personal Campaign Data written to DWN', {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, 
    });
      return record;
  } catch (error) {
    toast.error('Error writing campaign data to DWN', {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, 
    });
  }
};


// const writeImageToDwn = async (imageDataFile) => {
//   const imageblob = new Blob([imageDataFile], { type: 'image/jpeg' });

//   try {
//   const fundraiseProtocol = fundraiseProtocolDefinition();
//   const { record, status } = await web5.dwn.records.create({
//     data: imageblob,
//     message: {
//         protocol: fundraiseProtocol.protocol,
//         schema: fundraiseProtocol.types.image.schema,
//         dataFormat: 'image/jpeg',
//         protocolPath: "image",
//         // parentId: contextId,
//         // contextId: contextId,
//         published: true,
//     },
//   });
//   // const { status: imagestatus } = await record.send(myDid);
//   // console.log(imagestatus);
//   console.log("imagerecord:", {record, status})
//   if (status.code === 200) {
//     return { ...imageblob, recordId: record.id };
//   }

//   toast.success('Image Data written to DWN', {
//     position: toast.POSITION.TOP_RIGHT,
//     autoClose: 3000, 
//   });
//     return record;
// } catch (error) {
//   console.log(error)

//   toast.error('Error writing image data to DWN', {
//     position: toast.POSITION.TOP_RIGHT,
//     autoClose: 3000, 
//   });
// }

// };

const writeDirectCauseToDwn = async (campaignData) => {

  try {
  const publicFundraiseProtocol = fundraiseProtocolDefinition();
  const { record, status } = await web5.dwn.records.write({
    data: campaignData,
    message: {
        protocol: publicFundraiseProtocol.protocol,
        protocolPath: "directCause",
        schema: publicFundraiseProtocol.types.directCause.schema,
        recipient: campaignData.recipientDid,
        published: true,
    },
  });

  if (status.code === 200) {
    return { ...campaignData, recordId: record.id };
  }

  // const conId = record.id;

    // if (imageData) {
    //   writeImageToDwn(imageData);
    // }

  toast.success('Direct Campaign Data written to DWN', {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000, 
  });
    return record;
} catch (error) {
  toast.error('Error writing direct campaign data to DWN', {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000, 
  });
}
};
      
  const handleCreateCause = async (e) => {
    e.preventDefault();
    setLoading(true); 

  // const requiredFields = ['title', 'name', 'target', 'deadline', 'description'];
  // const emptyFields = requiredFields.filter((field) => ![field]);

  // if (emptyFields.length > 0) {
  //     toast.error('Please fill in all required fields.', {
  //     position: toast.POSITION.TOP_RIGHT,
  //     autoClose: 3000, 
  //     });
      
  //     requiredFields.forEach((field) => {
  //     if (![field]) {
  //         // Find the corresponding input element and add the error class
  //         const inputElement = document.querySelector(`[name="${field}"]`);
  //         if (inputElement) {
  //         inputElement.parentElement?.classList.add('error-outline');
  //         }
  //     }
  //     });
  //     return; // Prevent form submission
  //   }

    try {
      const targetDid = campaignType === 'Public' ? recipientDid : myDid;
      let campaignData;
      let record;
      // let imageRecord;

      if (campaignType === 'Public') {
        console.log('Sending direct mesage...');
        console.log(recipientDid);
        campaignData = constructPublicCampaign(recipientDid);
        record = await writeDirectCauseToDwn(campaignData);
        // imageRecord = await writeImageToDwn(imageData);
      } else {
        campaignData = constructPersonalCampaign();
        record = await writeSecretCauseToDwn(campaignData);
        // imageRecord = await writeImageToDwn(imageData);
      }

      if (record) {
        console.log(targetDid);
        const { status } = await record.send(targetDid);
        // const { status: imageStatus } = await imageRecord.send(targetDid);
        console.log("Send record status in handleCreateCause", status);
        // console.log("Send image record status in handleCreateCause", imageStatus);
        await fetchCampaigns();
      } else {
        toast.error('Failed to create record', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
          });
        throw new Error('Failed to create record');       
      }

      setTitle("");
      setName("");
      setTarget("");
      setDeadline("");
      setDescription("");
      setRecipientDid("");
      // imageData = "";

      setCreatePopupOpen(false);
      
      toast.success('Campaign created successfully.', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });

      setLoading(false);
      }
      catch (error) {
        console.error('Error in handleCreateCause', error);
        toast.error(`Error in handleCreateCause, ${error}`, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
          });
        setLoading(false);
      }
  };

  const shareCampaign = async (recordId) => {
    setShareLoading(true);
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
        const { status } = await record.send(recipientDid);
        console.log("Send record status in shareCampaign", status);
        toast.success('Campaign shared successfully.', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
        setShareLoading(false);
        setSharePopupOpen(false);
      } else {
        console.error('No record found with the specified ID');
        toast.error('No record found with the specified ID', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
      }
      setShareLoading(false);
    } catch (error) {
      console.error('Error in shareCampaign:', error);
      toast.error('Error in shareCampaign:', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
      setShareLoading(false);
    }
  };
  
  const constructPublicCampaign = (recipientDid) => {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      return {
        title: title,
        name: name,
        target: target,
        timestamp: `${currentDate} ${currentTime}`,
        sender: myDid, 
        type: 'Public', 
        description: description,
        deadline: deadline,
        recipientDid: recipientDid,
        amountRaised: amountRaised
      };
  }

  const constructPersonalCampaign = () => {
     const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

   return {
      title: title,
      name: name,
      timestamp: `${currentDate} ${currentTime}`,
      sender: myDid, 
      type: 'Personal',
      target: target,
      description: description,
      deadline: deadline,
    };
  };

  const fetchPersonalCampaigns = async () => {
    try {
        const response  = await web5.dwn.records.query({
          from: myDid,
          message: {
            filter: {
              protocol: "https://shege.xyz",
              schema: "https://shege.xyz/personalCauseSchema",
            },
          },
        });
        console.log('personal response', response);

        // Get images from DWN

        // const imagerecords = await web5.dwn.records.query({
        //   from: myDid,
        //   message: {
        //     filter: {
        //       protocol: "https://shege.xyz",
        //       protocolPath: "image",
        //     },
        //   },
        // });
        // console.log('imagerecords', imagerecords);
        
        // const campaignIds = [];

        if (response.status.code === 200) {
          const personalCampaigns =  await Promise.all(
            response.records.map(async (record) => {
              const data = await record.data.json();
              return {
                ...data, 
                recordId: record.id 
              };
            })
        );

        // imagerecords.records.forEach(async (imageRec) => {
        //   console.log('this is the each image record', imageRec);
        //   // Get the blob of the image data
        //   const imageId = imageRec.id
        //   console.log(imageId)
        //    const {record, status }= await web5.dwn.records.read({
        //     from: myDid,
        //     message: {
        //        filter: {
        //         recordId: imageId,
        //        },
        //     },
        //     });
        //   console.log ({record, status})
        //   const imageresult = await record.data.blob();
        //   console.log(imageresult)
        //   const imageid = await record.contextId;  
        //   console.log(imageid)         
        //   const imageUrl = URL.createObjectURL(imageresult);
        //   console.log(imageUrl)
        //   setImageURLs(prevImageURLs => [...prevImageURLs, imageUrl]);
        // })

          return personalCampaigns;
        } else {
          console.error('Error fetching personal campaigns:', response.status);
          return [];
        }
  } catch (error) {
    console.error('Error in fetchCampaigns:', error);
  }
};


const fetchPublicCampaigns = async () => {
  try {
  const response = await web5.dwn.records.query({
    message: {
      filter: {
        protocol: "https://shege.xyz",
        schema: "https://shege.xyz/directCauseSchema",
      },
    },
  });

  if (response.status.code === 200) {
    const publicCampaigns = await Promise.all(
      response.records.map(async (record) => {
        const data = await record.data.json();
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
  setGetCampaignsLoading(true);
  try {
    const personalCampaigns = await fetchPersonalCampaigns();
    const publicCampaigns = await fetchPublicCampaigns();
    const allCampaigns = [...(personalCampaigns || []), ...(publicCampaigns || [])]; 
    setCampaigns(allCampaigns)
    toast.success('Campaigns fetched successfully:', {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, 
    });
    setGetCampaignsLoading(false);
  } catch (error) {
    console.error('Error in fetchCampaigns:', error);
    toast.error('Error fetching campaigns:', {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, 
    });
    setGetCampaignsLoading(false);
  }
};

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
        toast.success('Campaign deleted successfully', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
        setCampaigns(prevCampaigns => prevCampaigns.filter(message => message.recordId !== recordId));
      } else {
        console.error('Error deleting message:', deleteResult.status);
        toast.error('Error deleting message:', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
      }
    } else {
      console.error('No record found with the specified ID');
      toast.error('No record found with the specified ID', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
    }
  } catch (error) {
    console.error('Error in deleteCampaign:', error);
    toast.error('Error in deleteCampaign:', {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, 
    });
  }
};
    

const updateCampaign = async (recordId, data) => {
    setUpdateLoading(true);
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
        toast.success('Campaign updated successfully.', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
        setCampaigns(prevCampaigns => prevCampaigns.map(message => message.recordId === recordId ? { ...message, ...data } : message));
        setUpdateLoading(false);
      } else {
        console.error('Error updating message:', updateResult.status);
        toast.error('Error updating campaign', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
        setGetCampaignsLoading(false);
      }
    } else {
      console.error('No record found with the specified ID');
      toast.error('No record found with the specified ID', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
    }
  } catch (error) {
    console.error('Error in updateCampaign:', error);
    toast.error('Error in updateCampaign:', {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, 
    });
    setGetCampaignsLoading(false);
  }
};


const writeDonationToDwn = async (name, amount, recipientDid, campaignTitle) => {

  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  const donationData = {
    name: name,
    amount: amount,
    campaignTitle: campaignTitle,
    timestamp: `${currentDate} ${currentTime}`,
    sender: myDid, 
    recipientDid: recipientDid,
  };

  try {
  const fundraiseProtocol = fundraiseProtocolDefinition();
  const { record, status } = await web5.dwn.records.write({
    data: donationData,
    message: {
        protocol: fundraiseProtocol.protocol,
        protocolPath: "donate",
        schema: fundraiseProtocol.types.donate.schema,
        recipient: donationData.recipientDid,
        published: true,
    },
  });
  console.log("donation written", record, status);

  if (status.code === 200) {
    return { ...donationData, recordId: record.id };
  }
  toast.success('Donation Data written to DWN', {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000,
  });
    return record;
} catch (error) {
  toast.error('Error writing donation data to DWN', {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000, 
  });
}
};


const handleDonation = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true); 

  // Validate the form fields
  // const requiredFields = ['name', 'amount'];
  // const emptyFields = requiredFields.filter((field) => ![field]);

  //   if (emptyFields.length > 0) {
  //       toast.error('Please fill in all required fields.', {
  //       position: toast.POSITION.TOP_RIGHT,
  //       autoClose: 3000, 
  //       });
        
  //       requiredFields.forEach((field) => {
  //       if (![field]) {
  //           // Find the corresponding input element and add the error class
  //           const inputElement = document.querySelector(`[name="${field}"]`);
  //           if (inputElement) {
  //           inputElement.parentElement?.classList.add('error-outline');
  //           }
  //       }
  //       });

  //       return; // Prevent form submission
  //   }


    try {
      let record;
      record = await writeDonationToDwn(name, amount, recipientDid, campaignTitle);

      if (record) {
        const { status } = await record.send(recipientDid);
        console.log(recipientDid);
        console.log("Send record status in handleDonation", status);
        toast.success('Donation record sent', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
        fetchDonations();
        setLoading(false);
      } else {
        throw new Error('Failed to create record');
      }
    
      setName("");
      setAmount("");
      setRecipientDid("");
      setCampaignTitle("");
      setLoading(false);

      setDonatePopupOpen(false);

      }
      catch (error) {
        console.error('Error in handleDonation', error);
        toast.error(`Error! Fillin the required fields`, {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
          });
        setLoading(false);
      }
  };


  const fetchDonations = async () => {
    setGetDonationsLoading(true);
    try {
    const response = await web5.dwn.records.query({
      message: {
        filter: {
          protocol: "https://shege.xyz",
          schema: "https://shege.xyz/donateSchema",
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
      setDonations(donations);
      toast.success('Donations fetched successfully.', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
      setGetDonationsLoading(false);
      return donations;
    } else {
      console.error('Error fetching donations:', response.status);
      toast.error('Error fetching donations:', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000, 
      });
      setGetDonationsLoading(false);
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
        toast.success('Donation deleted successfully', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
        setDonations(prevDonations => prevDonations.filter(message => message.recordId !== recordId));
      } else {
        console.error('Error deleting message:', deleteResult.status);
        toast.error('Error deleting donation:', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, 
        });
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
                  Your Decentralized Identifier is your unique digital identity on the Shege Fund platform.
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
                className="wow fadeInUp mb-12 text-2xl dark:hover:bg-primary/[20%] rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]">
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
                                        Target (USD)
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
                                          // onChange={handleImageInputChange}
                                          required
                                          className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-full px-4 md:w-1/2">
                                    <div className="mb-8">
                                      <label
                                        htmlFor="campaignType"
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
                                          <option value="Personal">Personal</option>
                                          <option value="Public">Public</option>
                                        </select>
                                          {campaignType === 'Public' && (
                                          <input
                                            className="w-full mt-5 rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                            type="text"
                                            value={recipientDid}
                                            onChange={(e) => setRecipientDid(e.target.value)}
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
            </div>

            <div className="w-full px-4 lg:w-5/12 xl:w-6/12">
          
              <div className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]" data-wow-delay=".15s">
                <div className="flex flex-row flex-wra justify-between">
                  <div>
                    <h2 className="mb-3 text-black dark:text-white lg:text-2xl xl:text-3xl">
                      Your Campaigns
                    </h2>
                    <p className="mb-12 text-base font-medium text-body-color">
                      Manage your campaigns.
                    </p>
                  </div>
                
                  <div className="relative mr-2 ">
                    <button 
                      type="button"
                      onClick={toggleFilterDropdown}
                      className="rounded-lg  bg-primary py-4 px-4 lg:px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                        Filter                     
                    </button>    
                      {filterDropdownVisible && (
                          <div className="absolute z-10 flex flex-row top-12 left-0 bg-primary w-full rounded-b-lg shadow-lg dark:bg-boxdark">
                            <ul className="py-2">
                              <li
                                onClick={() => handleFilter('Personal')}
                                className={`cursor-pointer px-4 py-2 ${
                                  filterOption === 'Personal' ? 'bg-primary text-white' : ''
                                }`}
                              >
                                Personal
                              </li>
                              <li
                                onClick={() => handleFilter('Public')}
                                className={`cursor-pointer px-4 py-2 ${
                                  filterOption === 'Public' ? 'bg-primary text-white' : ''
                                }`}
                              >
                                Public
                              </li>
                            
                            
                              <li
                                onClick={() => handleFilter('All')}
                                className={`cursor-pointer px-4 py-2 ${
                                  filterOption === 'All' ? 'bg-primary text-white' : ''
                                }`}
                            >
                              All
                            </li>
                          </ul>
                        </div>
                      )}               
                  </div>
                  <div className="">
                    <button 
                      type="button"
                      onClick={fetchCampaigns}
                      disabled={getCampaignsLoading}
                      className="rounded-lg bg-primary py-4 px-4 lg:px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                        {getCampaignsLoading ? (
                          <div className="flex items-center">
                            <div className="spinner"></div>
                            <span className="pl-1">Fetching...</span>
                          </div>
                        ) : (
                          <>Refresh</>
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
                          className="flex flex-col items-center px-4 py-3 bg-white rounded-lg shadow-one dark:bg-[#242B51]"
                        >
                          <div className="flex items-center p-3">
                            <div className="flex flex-wrap w-full">
                            {/* <div className="w-full mb-5 text-xs text-gray-500 dark:text-gray-400">
                              <Image src={imageURLs[index]} alt="campaign image" width={100} height={100} />                           
                            </div>  */}
                             <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Name</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {campaign.name}
                                </h4>
                              </div>
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Title</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {campaign.title}
                                </h4>
                              </div>
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Target (USD)</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {campaign.target}
                                </h4>
                              </div>
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Deadline</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {campaign.deadline}
                                </h4>
                              </div>
                              <div className="w-full mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Description</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {campaign.description}
                                </h4>
                              </div>
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Timestamp</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {campaign.timestamp}
                                </h4>
                              </div>
                              {campaign && campaign.recipientDid ? (
                                <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Recipient</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {shortenDID(campaign.recipientDid, 15)}
                                </h4>
                              </div>
                              ) : null
                            }
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Sender</span>
                                <h4 className="text-sm mt-1 text-black dark:text-white">
                                <input
                                    type="text"
                                    value={campaign.sender}
                                    readOnly
                                    className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                  />
                                  <button
                                    onClick={handleCopyDid}
                                    className="absolute px-2 py-2 bg-primary rounded-lg dark:bg-white dark:text-black"
                                  >
                                    {didCopied ? "Copied" : "Copy"}
                                  </button>
                                  {/* {shortenDID(campaign.sender, 15)} */}
                                </h4>
                              </div>
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Amount Raised (USD)</span>
                                <h4 className="text-sm mt-1 text-black dark:text-white">
                                  {campaign.amountRaised}
                                </h4>
                              </div>
                              <div className="w-1/2 mb-5  text-gray-500 dark:text-gray-400">
                                <h4 className={`text-sm mt-1 py-1 px-2 rounded-xl w-fit ${campaign.type === "Personal" ? 'bg-success' : 'bg-warning'}  text-black dark:text-white`}>
                                  {campaign.type}
                                </h4>
                              </div>                            
                            </div>                           
                          </div>
                          <div className="flex flex-row w-80 justify-evenly">
                            {campaign.sender === myDid && campaign.type === "Personal" && (
                             <div className="flex w-full flex-row justify-evenly">
                              <div className="flex mb-5 p-3 w-20 justify-center rounded-xl bg-success">
                                <button
                                  onClick={() => togglePopup(campaign.recordId)}
                                  className="text-md  font-medium"
                                  >
                                  Edit
                                </button>
                                {popupOpenMap[campaign.recordId] && (
                                  <div
                                    ref={popup}
                                    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
                                  >
                                    <div
                                        className="lg:mt-15 lg:w-1/2 rounded-lg bg-primary/[100%] dark:bg-dark pt-3 px-4 shadow-md"
                                        style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'scroll' }}
                                      >      
                                      <div
                                        className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
                                        data-wow-delay=".15s
                                        ">        
                                          <div className="flex flex-row justify-between ">
                                            <h2 className="text-xl font-semibold mb-4">Edit Campaign</h2>
                                            <div className="flex justify-end">
                                              <button
                                                onClick={() => closePopup(campaign.recordId)}
                                                className="text-blue-500 hover:text-gray-700 focus:outline-none"
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  className="h-5 w-5 fill-current bg-primary rounded-full p-1 hover:bg-opacity-90"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="white"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M6 18L18 6M6 6l12 12"
                                                  />
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
                                              Target (USD)
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
                                                // onChange={handleImageInputChange}
                                                required
                                                className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="w-full px-4 md:w-1/2">
                                          <div className="mb-8">
                                            <label
                                              htmlFor="campaignType"
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
                                                <option value="Personal">Personal</option>
                                                <option value="Public">Public</option>
                                              </select>
                                                {campaignType === 'Public' && (
                                                <input
                                                  className="w-full mt-5 rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                                  type="text"
                                                  value={recipientDid}
                                                  onChange={(e) => setRecipientDid(e.target.value)}
                                                  placeholder="Enter recipient's DID"
                                                />
                                                )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="w-full px-4">
                                          <button 
                                            type="button"
                                            onClick={() => updateCampaign(campaign.recordId, title)}
                                            disabled={updateLoading}
                                            className="rounded-lg bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                                            {updateLoading ? (
                                              <div className="flex items-center">
                                                <div className="spinner"></div>
                                                <span className="pl-1">Updating...</span>
                                              </div>
                                            ) : (
                                              <>Update</>
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
                                <div className="flex mb-5 p-3 w-20 justify-center rounded-xl bg-danger">
                                <button
                                  onClick={() => showDeleteConfirmation(campaign.recordId)}
                                  className="text-md font-medium"
                                  >
                                  Delete
                                </button>
                                {isDeleteConfirmationVisible && (
                                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                                    <div className="p-5 rounded-lg bg-primary/[70%] dark:bg-dark shadow-md">
                                      <p>Are you sure you want to delete this campaign?</p>
                                      <div className="mt-4 flex justify-end">
                                        <button
                                          onClick={hideDeleteConfirmation}
                                          className="mr-4 rounded bg-primary py-2 px-3 text-white hover:bg-opacity-90"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => {
                                            hideDeleteConfirmation();
                                            deleteCampaign(campaign.recordId);
                                          }}
                                          className="rounded bg-danger py-2 px-3 text-white hover:bg-opacity-90"
                                        >
                                          Confirm
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              </div>
                            )}

                            {campaign.sender === myDid && campaign.type === "Public" && (
                              <div className="flex w-full flex-row justify-evenly">
                              <div className="flex mb-5 p-3 w-20 justify-center rounded-xl bg-success">
                                <button
                                ref={trigger}
                                onClick={() => setSharePopupOpen(!sharePopupOpen)}
                                  className="text-md  font-medium"
                                  >
                                  Share
                                </button>
                                {sharePopupOpen && (
                                  <div
                                    ref={popup}
                                    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
                                  >
                                    <div
                                        className="lg:mt-15 lg:w-1/2 rounded-lg bg-primary/[100%] dark:bg-dark pt-3 px-4 shadow-md"
                                        style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'scroll' }}
                                      >      
                                      <div
                                        className="wow fadeInUp mb-12 rounded-lg bg-primary/[10%] py-11 px-8 dark:bg-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]"
                                        data-wow-delay=".15s
                                        ">        
                                          <div className="flex flex-row justify-between ">
                                            <h2 className="text-xl font-semibold mb-4">Share Campaign</h2>
                                            <div className="flex justify-end">
                                              <button
                                                onClick={() => setSharePopupOpen(false)}
                                                className="text-blue-500 hover:text-gray-700 focus:outline-none"
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  className="h-5 w-5 fill-current bg-primary rounded-full p-1 hover:bg-opacity-90"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  stroke="white"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M6 18L18 6M6 6l12 12"
                                                  />
                                                </svg>
                                              </button>
                                            </div>  
                                          </div>
                                        <form>
                                      <div className="-mx-4 flex flex-wrap">
                                        <div className="w-full px-4">
                                          <div className="mb-8">
                                            <label
                                              htmlFor="recipientDid"
                                              className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                            >
                                              Recipient DID
                                            </label>
                                            <div>
                                            <input
                                              type="text"
                                              name="recipientDid"
                                              value={recipientDid}
                                              onChange={(e) => setRecipientDid(e.target.value)}
                                              placeholder="Paste Recipient DID"
                                              required
                                              className="w-full rounded-lg border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                            />
                                            </div>
                                          </div>
                                        </div>
                                        
                                       
                                        <div className="w-full px-4">
                                          <button 
                                            type="button"
                                            onClick={() => shareCampaign(campaign.recordId)}
                                            disabled={shareLoading}
                                            className="rounded-lg bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                                            {shareLoading ? (
                                              <div className="flex items-center">
                                                <div className="spinner"></div>
                                                <span className="pl-1">Sharing...</span>
                                              </div>
                                            ) : (
                                              <>Share</>
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
                              <div className="flex mb-5 p-3 w-20 justify-center rounded-xl bg-danger">
                                <button
                                  onClick={() => showDeleteConfirmation(campaign.recordId)}
                                  className="text-md font-medium"
                                  >
                                  Delete
                                </button>
                                {isDeleteConfirmationVisible && (
                                  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                                    <div className="p-5 rounded-lg bg-primary/[70%] dark:bg-dark shadow-md">
                                      <p>Are you sure you want to delete this campaign?</p>
                                      <div className="mt-4 flex justify-end">
                                        <button
                                          onClick={hideDeleteConfirmation}
                                          className="mr-4 rounded bg-primary py-2 px-3 text-white hover:bg-opacity-90"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => {
                                            hideDeleteConfirmation();
                                            deleteCampaign(campaign.recordId);
                                          }}
                                          className="rounded bg-danger py-2 px-3 text-white hover:bg-opacity-90"
                                        >
                                          Confirm
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              </div>
                            )} 
                            
                            {campaign.sender !== myDid && (
                            <div className="flex mb-5 p-3 w-20 justify-center rounded-xl bg-success">
                            <button
                              ref={trigger}
                              onClick={() => setDonatePopupOpen(!donatePopupOpen)}
                              className="text-md font-medium">
                                Donate
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
                                        <div className="w-full px-4 md:w-1/2">
                                            <div className="mb-8">
                                              <label
                                                htmlFor="recipientDid"
                                                className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                              >
                                                Recipient DID
                                              </label>
                                              <div>
                                              <input
                                                    className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                                    type="text"
                                                    name="recipientDid"
                                                    value={recipientDid}
                                                    onChange={(e) => setRecipientDid(e.target.value)}
                                                    placeholder="Paste the Did"
                                                  />
                                              </div>
                                            </div>
                                          </div>
                                          <div className="w-full px-4 md:w-1/2">
                                            <div className="mb-8">
                                              <label
                                                htmlFor="campaign"
                                                className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                              >
                                                Campaign Title
                                              </label>
                                              <div>
                                              <input
                                                    className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                                    type="text"
                                                    name="campaign"
                                                    value={campaignTitle}
                                                    onChange={(e) => setCampaignTitle(e.target.value)}
                                                    placeholder="Campaign Title"
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
                                                onChange={(e) => setName(e.target.value)}
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
                                                htmlFor="amount"
                                                className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                              >
                                                Amount (USD)
                                              </label>
                                              <div>
                                              <input
                                                type="text"
                                                name="amount"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
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
                                              disabled={donationLoading}
                                              className="rounded-md bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                                              {donationLoading ? (
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
                            )}
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
                          disabled={getDonationsLoading}
                          className="rounded-lg bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                          {getDonationsLoading ? (
                            <div className="flex items-center">
                              <div className="spinner"></div>
                              <span className="pl-1">Fetching...</span>
                            </div>
                          ) : (
                            <>Refresh</>
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
                          className="flex flex-col items-center px-4 py-3 bg-white rounded-lg shadow-one dark:bg-[#242B51]"
                        >
                          <div className="flex items-center p-3"> 
                            <div className="flex flex-wrap w-full">
                            <div className="w-full mb-5 text-gray-500 dark:text-gray-400">
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {donation.name} committed {donation.amount} USD to {donation.campaignTitle} Campaign.
                                </h4>
                              </div>
                              
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Sender</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {shortenDID(donation.sender, 15)}
                                </h4>
                              </div>
                                {donation && donation.recipientDid ? (
                                  <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                  <span className="text-md">Recipient</span>
                                  <h4 className="text-sm mt-1  text-black dark:text-white">
                                    {shortenDID(donation.recipientDid, 15)}
                                  </h4>
                                </div>
                                ) : null
                              }
                              <div className="w-1/2 mb-5 text-gray-500 dark:text-gray-400">
                                <span className="text-md">Timestamp</span>
                                <h4 className="text-sm mt-1  text-black dark:text-white">
                                  {donation.timestamp}
                                </h4>
                              </div>
                            </div>
                          </div>
                          {donation.sender === myDid && (
                          <div className="flex mb-5 p-3 w-20 justify-center rounded-xl bg-danger">
                            <button
                              onClick={() => showDeleteConfirmation(donation.recordId)}
                              className="text-md font-medium"
                            >
                              Delete
                            </button>
                            {isDeleteConfirmationVisible && (
                                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                                  <div className="p-5 rounded-lg bg-primary/[70%] dark:bg-dark shadow-md">
                                    <p>Are you sure you want to delete this donation record?</p>
                                    <div className="mt-4 flex justify-end">
                                      <button
                                        onClick={hideDeleteConfirmation}
                                        className="mr-4 rounded bg-primary py-2 px-3 text-white hover:bg-opacity-90"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => {
                                          hideDeleteConfirmation();
                                          deleteDonation(donation.recordId);
                                        }}
                                        className="rounded bg-danger py-2 px-3 text-white hover:bg-opacity-90"
                                      >
                                        Confirm
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                          )}
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
  












