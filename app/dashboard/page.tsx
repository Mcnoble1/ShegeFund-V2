"use client";

import Breadcrumb from "@/components/Common/Breadcrumb";
import Dashboard from "@/components/Dashboard";

const CreateCause = () => {
    return (
      <>
        <Breadcrumb
          pageName="Dashboard"
          description="Setup a Fundraiser that your Shege may be well funded"
        />
  
        <Dashboard />
      </>
    );
};

export default CreateCause;
