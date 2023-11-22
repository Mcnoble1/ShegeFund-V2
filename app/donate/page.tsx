"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Donate from "@/components/Donate";

const DonateToCause = () => {
  return (
    <>
      <Breadcrumb
        pageName="Donate to Cause"
        description="Put your money where your mouth is. Donate to a cause you believe in."
      />

      <Donate />
    </>
  );
};

export default DonateToCause;
