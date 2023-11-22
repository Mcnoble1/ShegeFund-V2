"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Create from "@/components/Create";

const CreateCause = () => {
    return (
      <>
        <Breadcrumb
          pageName="Create Cause"
          description="Setup a Fundraiser that your Shege may be well funded"
        />
  
        <Create />
      </>
    );
};

export default CreateCause;
