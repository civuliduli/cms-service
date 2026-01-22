"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Br, Cut, Line, Printer, Text, Row, render } from 'react-thermal-printer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function Home() {
  const [fullName, setFullName] = useState<string>("");
  const [deviceType, setDeviceType] = useState<string>("Mob");
  const [problem, setProblem] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [price, setPrice] = useState<string>("");

async function handleSubmit({ fullName, deviceType, problem, phoneNumber, price }: { 
  fullName: string; 
  deviceType: string; 
  problem: string; 
  phoneNumber: string; 
  price: string 
}) {
  try {
    // 1. Save to Supabase
    const { error } = await supabase.from("services").insert([
      { fullName, deviceType, problem, phoneNumber, price, isReady: false },
    ]);
    if (error) throw error;

    alert("Service request submitted successfully!");

    // 2. Prepare the Receipt
    const receipt = (
      <Printer type="epson" width={42} characterSet="korea">
        <Text size={{ width: 2, height: 2 }} align="center">CMS-Debar</Text>
        <Text bold={true} align="center">Service Receipt</Text>
        <Br />
        <Line />
        <Row left="Customer" right={fullName} />
        <Row left="Device" right={deviceType} />
        <Row left="Problem" right={problem} />
        <Row left="Phone" right={phoneNumber} />
        <Row left="Price" right={`${price} DEN`} />
        <Line />
        <Br />
        <Text align="center">Thank you for your business!</Text>
        <Br />
        <Text align="center">Status: Pending</Text>
        <Cut />
      </Printer>
    );

    // 3. Render to Binary Data
    const data = await render(receipt);

    // 4. Send to Printer (Web Serial Example)
    if ("serial" in navigator) {
      try {
        const port = await (navigator).serial.requestPort();
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        await port.close();
      } catch (err) {
        console.error("Printer connection failed:", err);
        alert("Could not connect to printer. Check USB connection.");
      }
    } else {
      alert("Your browser does not support Web Serial printing. Use Chrome or Edge.");
    }

    // 5. Clear Form
    setFullName("");
    setDeviceType("Mob");
    setProblem("");
    setPhoneNumber("");
    setPrice("");

  } catch (error) {
    console.error("Error submitting service request:", error);
    alert("Failed to submit service request.");
  }
}
  

  return (
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label
            htmlFor="fullName"
            className="block text-sm/6 font-medium text-white"
          >
            Full Name
          </label>
          <div className="mt-2">
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName || ""}
              onChange={(e) => setFullName(e.target.value)} // Capture change
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div className="sm:col-span-2 sm:col-start-1">
          <label
            htmlFor="deviceType"
            className="block text-sm/6 font-medium text-white"
          >
            Device Type
          </label>
          <div className="mt-2">
            <select
              id="deviceType"
              name="deviceType"
              value={deviceType} // Controlled component
              onChange={(e) => setDeviceType(e.target.value)}
              className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 py-1.5 pr-8 pl-3 text-base text-white outline-1 -outline-offset-1 outline-white/10 *:bg-gray-800 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            >
              <option value="Mob">Mob</option>
              <option value="Tablet">Tablet</option>
              <option value="Laptop">Laptop</option>
              <option value="PC">PC</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="city"
            className="block text-sm/6 font-medium text-white"
          >
            Problem
          </label>
          <div className="mt-2">
            <input
              id="problem"
              name="problem"
              type="text"
              value={problem || ""}
              onChange={(e) => setProblem(e.target.value)}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label
            htmlFor="last-name"
            className="block text-sm/6 font-medium text-white"
          >
            Mob
          </label>
          <div className="mt-2">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="number"
              value={phoneNumber || ""}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>

        <div className="sm:col-span-3 sm:col-start-1">
          <label
            htmlFor="first-name"
            className="block text-sm/6 font-medium text-white"
          >
            Price
          </label>
          <div className="mt-2">
            <input
              id="price"
              name="price"
              type="number"
              value={price || ""}
              onChange={(e) => setPrice(e.target.value)}
              className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
            />
          </div>
        </div>
        <div className="sm:col-span-3 sm:col-start-1">
          <button
            type="submit"
            className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            onClick={() => handleSubmit({ fullName, deviceType, problem, phoneNumber, price })}
          >
            Save
          </button>
        </div>
      </div>
  );
}
