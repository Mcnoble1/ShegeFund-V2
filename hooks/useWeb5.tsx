// import { useEffect, useState } from 'react';

// import { webcrypto } from 'node:crypto';
// // @ts-ignore

// // @ts-ignore
// if (!globalThis.crypto) globalThis.crypto = webcrypto;

// const useWeb5 = () => {
//   const [web5, setWeb5] = useState(null);
//   const [myDid, setMyDid] = useState(null);

//   useEffect(() => {

//       const initWeb5 = async () => {
//         // @ts-ignore
//         const { Web5 } = await import('@web5/api/browser');
        
//         try {
//           const { web5, did } = await Web5.connect({sync: '5s'});
//           setWeb5(web5);
//           setMyDid(did);
//           console.log(web5);
//           if (web5 && did) {
//             console.log('Web5 initialized');
//           }
//         } catch (error) {
//           console.error('Error initializing Web5:', error);
//         }
//       };
  
//       initWeb5();
   
//   }, []);

//   return { web5, myDid };
// };

// export default useWeb5;
