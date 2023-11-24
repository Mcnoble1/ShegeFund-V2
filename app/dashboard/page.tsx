"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Dashboard from "@/components/Dashboard";

const CreateCause = () => {
    return (
      <>
        <Breadcrumb
          pageName="Create Cause"
          description="Setup a Fundraiser that your Shege may be well funded"
        />
  
        <Dashboard />
      </>
    );
};

export default CreateCause;
