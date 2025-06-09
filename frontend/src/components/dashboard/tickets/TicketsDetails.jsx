import React from "react";
import Hero1 from "../../../assets/hero1.png";
import { PrimaryButton } from "../../ui/Button";

const TicketsDetails = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className=" h-[70%] w-[25%] rounded-4xl text-amber-50 bg-blue-900/10 flex flex-col items-center justify-around">
        <h1 className="text-3xl font-serif">TicketsDetails</h1>
        <div>
          <img
            src={Hero1}
            alt=""
            width={180}
            height={180}
            objectFit="contain"
          />
        </div>
        <div className="flex gap-4 justify-between w-full px-12">
          <div>
          <span>Date :</span><span>14/05/2023</span> <br />
          <span>Time :</span><span>14:00</span>
        </div>
        <div>
          <span>Location</span> <br/>
          <span>Virandavan Hall</span>
        </div>
        </div>
        <div>
          <PrimaryButton >
            <span className="text-xl">Buy Ticket</span>
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default TicketsDetails;
