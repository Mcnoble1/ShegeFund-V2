import React, { useEffect, useRef, useState } from "react";
// import useWeb5 from '../../hooks/useWeb5';  
import Link from "next/link";
import ThemeToggler from "./ThemeToggler";


const Header = () => {

  const [loading, setLoading] = useState<boolean>(false);
  const [generateLoading, setGenerateLoading] = useState<boolean>(false);
  const [donatePopupOpen, setDonatePopupOpen] = useState(false);
  const [existingDid, setExistingDid] = useState("");
  const [identityAgent, setIdentityAgent] = useState("")
  const [connect, setConnect] = useState('Connect')

  const trigger = useRef<HTMLButtonElement | null>(null);
  const popup = useRef<HTMLDivElement | null>(null);

  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  useEffect(() => {
    if (donatePopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [donatePopupOpen]);
  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });


// Function to shorten the DID
const shortenDID = (did, length) => {
  if (did.length <= length) {
    return did;
  } else {
    const start = did.substring(0, length);
    const end = '...';
    return start + end;
  }
}

const handleConnect = async () => {
  // const {web5, did} = await Web5.connect({
  //   agent: identityAgent,
  //   connectedDid: existingDid
  // });

  // shortenDID(did, 15)
}

// const { web5, myDid } = useWeb5();

const handleGenerate = async () => {
  // const newDid = shortenDID(myDid, 15)
  // setConnect(newDid)
  // setDonatePopupOpen(false);
}


  

  return (
    <>
      <header
        className={`header top-0 left-0 z-40 flex w-full items-center bg-transparent ${
          sticky
            ? "!fixed !z-[9999] !bg-white !bg-opacity-80 shadow-sticky backdrop-blur-sm !transition dark:!bg-primary dark:!bg-opacity-20"
            : "absolute"
        }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 text-3xl font-bold max-w-full px-4 xl:mr-12">
              <Link
                href="/"
                className={`header-logo block w-full ${
                  sticky ? "py-5 lg:py-2" : "py-8"
                } `}
              >
                ShegeFund
              </Link>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="absolute right-4 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-[6px] ring-primary focus:ring-2 lg:hidden"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[7px] rotate-45" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "opacity-0 " : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[-8px] -rotate-45" : " "
                    }`}
                  />
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar absolute right-0 z-30 w-[250px] rounded border-[.5px] border-body-color/50 bg-white py-4 px-6 duration-300 dark:border-body-color/20 dark:bg-dark lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100 ${
                    navbarOpen
                      ? "visibility top-full opacity-100"
                      : "invisible top-[120%] opacity-0"
                  }`}
                >
                </nav>
              </div>
              <div className="flex items-center justify-end pr-16 lg:pr-0">
                <button
                ref={trigger}
                onClick={() => setDonatePopupOpen(!donatePopupOpen)}
                  className="ease-in-up hidden rounded-md bg-primary py-3 px-8 text-base font-bold text-white transition duration-300 hover:bg-opacity-90 hover:shadow-signUp md:block md:px-9 lg:px-6 xl:px-9"
                >
                 {connect}
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
                                    Already have a DID? Use it.
                                  </h2>
                                  <p className="mb-12 text-base font-medium text-body-color">
                                    If not, we will generate your unique DID.
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
                                  Your DID
                                </label>
                                <div>
                                <input
                                      className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                      type="text"
                                      value={existingDid}
                                      onChange={e => setExistingDid(e.target.value)}
                                      placeholder="Paste your DID"
                                    />
                                </div>
                              </div>
                            </div>
                            <div className="w-full px-4 ">
                              <div className="mb-8">
                                <label
                                  htmlFor="name"
                                  className="mb-3 block text-sm font-medium text-dark dark:text-white"
                                >
                                  Your Identity Agent
                                </label>
                                <div>
                                <input
                                      className="w-full rounded-md border border-transparent py-3 px-6 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-[#242B51] dark:shadow-signUp"
                                      type="text"
                                      value={identityAgent}
                                      onChange={e => setIdentityAgent(e.target.value)}
                                      placeholder="Paste your Identity Agent"
                                    />
                                </div>
                              </div>
                            </div>
                            <div className="w-full px-4 flex justify-between">
                              <button 
                                type="button"
                                onClick={handleConnect}
                                disabled={loading}
                                className="rounded-md bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                                {loading ? (
                                  <div className="flex items-center">
                                    <div className="spinner"></div>
                                    <span className="pl-1">Connecting...</span>
                                  </div>
                                ) : (
                                  <>Connect</>
                                )}
                              </button>
                              <button 
                                type="button"
                                onClick={handleGenerate}
                                disabled={loading}
                                className="rounded-md bg-primary py-4 px-9 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp">
                                {generateLoading ? (
                                  <div className="flex items-center">
                                    <div className="spinner"></div>
                                    <span className="pl-1">Generating...</span>
                                  </div>
                                ) : (
                                  <>Generate DID</>
                                )}
                              </button>
                            </div>
                          </div>
                          </form>
                            </div>
                    </div>
                  </div>
                )}
                <div>
                  <ThemeToggler />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;







