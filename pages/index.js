import Head from "next/head";
import Web3 from "web3";
import React, { useState, useEffect, useRef } from "react";
import { Moralis } from "moralis";
import { useMoralis } from "react-moralis";
import { ToastContainer, toast } from "react-toastify";
import { BigNumber } from "bignumber.js";
import "react-toastify/dist/ReactToastify.css";
const TRANSFORM_ABI = require("../abi/TRANSFORM_ABI");
const V2ABI = require("../abi/V2ABI");

export default function Home() {
  const { isAuthenticated, authenticate, user, logout } = useMoralis();
  const [wallet, setWallet] = useState("");
  const [login, setLogin] = useState(false);
  const [balance, setBalanace] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const [approved, setApproved] = useState(false);
  Moralis.serverURL = process.env.NEXT_PUBLIC_SERVER_URL;
  const amountValue = useRef(null);

  useEffect(async () => {
    if (isAuthenticated) {
      if (!login) {
        logout();
      } else {
        const web3 = new Web3(window.ethereum);
        const walletAddress = await user.get("ethAddress");
        setWallet(
          walletAddress.slice(0, 5) +
          "..." +
          walletAddress.slice(
            walletAddress.length - 4,
            walletAddress.length - 0
          )
        );
        // const options = { chain: 'bsc', address: walletAddress, token_addresses: "0xc98a8EC7A07f1b743E86896a52434C4C6A0Dbc42" }

        const getbalance = await getBalance();
        setBalanace(getbalance);

        let tokcontract = new web3.eth.Contract(V2ABI, process.env.TOKEN_V1);
        const isAprove = await tokcontract.methods
          .allowance(walletAddress, process.env.TRANSFORM)
          .call();
        if (isAprove > 0) {
          setApproved(true);
        }

      }
    } else {
      setMaxAmount("0");
    }
    window.ethereum.on("accountsChanged", async () => {
      logout();
      setBalanace("0");
      setApproved(false);
      setLogin(false);
    });
  }, [isAuthenticated, balance]);

  const getBalance = async () => {
    const walletAddress = await user.get("ethAddress");
    const options = {
      chain: "bsc",
      address: walletAddress,
      token_addresses: process.env.TOKEN_V1,
    };
    const balances = await Moralis.Web3API.account.getTokenBalances(
      options
    );
    if (balances.length > 0) return (balances[0].balance / 10 ** 9);
    return "0";
  }

  const loginEvt = async () => {
    const web3 = await Moralis.enableWeb3();
    const chainIdHex = await Moralis.switchNetwork("0x38");

    setLogin(true);
    await authenticate({
      signingMessage: "Signing in ASIX Token Swap",
    });
  }

  const logoutEvt = async () => {
    await logout();
    setWallet("");
    setBalanace("0");
    setApproved(false);
    console.log("logged out");
  }

  const formatUang = (angka) => {
    var number_string = angka.toString().replace(/[^.\d]/g, ""),
      split = number_string.split("."),
      sisa = split[0].length % 3,
      uang = split[0].substr(0, sisa),
      ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      var separator = sisa ? "," : "";
      uang += separator + ribuan.join(",");
    }

    uang = split[1] != undefined ? uang + "," + split[1] : uang;
    return uang;
  }

  const hanyaAngka = (event) => {
    let value = event.target.value;
    value = value.replace(/,/g, "");
    value = parseInt(value).toString();

    if (isNaN(value)) {
      value = "0";
    }
    if (parseInt(value) > parseInt(balance)) {
      return maxSend();
    }

    let inp = formatUang(value);
    setMaxAmount(inp);
  }

  const maxSend = () => {
    return setMaxAmount(formatUang(parseInt(balance).toString()));
  }

  const approve = async () => {
    const web3 = new Web3(window.ethereum);
    try {
      let user = Moralis.User.current();
      const walletAddress = await user.get("ethAddress");
      await Moralis.enableWeb3();

      let tokcontract = new web3.eth.Contract(V2ABI, process.env.TOKEN_V1);
      const amountApprove = (100000000 * 10 ** 28).toLocaleString("fullwide", {
        useGrouping: false,
      });
      tokcontract.methods.approve(process.env.TRANSFORM, amountApprove).send(
        {
          from: walletAddress,
          value: 0,
        },
        (err, ressw) => {
          toast.info("Approving Transform_Contract to spend. Please wait", {
            autoClose: 10000,
            position: toast.POSITION.TOP_CENTER,
          });
          if (err) {
            toast.error("Transaction failed!", {
              position: toast.POSITION.TOP_CENTER,
            });
          } else {
            if (ressw) {
              setTimeout(() => {
                toast.success("Success Enable Transform_Contract", {
                  position: toast.POSITION.TOP_CENTER,
                });
                setApproved(true);
              }, 3000);
            } else {
              setApproved(true);
            }
          }
        }
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  const Transform = async () => {
    const web3 = new Web3(window.ethereum);
    try {
      let user = Moralis.User.current();
      const walletAddress = user.get("ethAddress");
      await Moralis.enableWeb3();

      let SwapV2 = new web3.eth.Contract(TRANSFORM_ABI, process.env.TRANSFORM);
      const amountSwap =
        new BigNumber(parseInt(amountValue.current.value.replace(/,/g, "")));

      SwapV2.methods.Transform(amountSwap).send(
        {
          from: walletAddress,
          value: 0,
        },
        (err, ressw) => {
          toast.info("Swapping your ASIX_V1. Please wait", {
            autoClose: 10000,
            position: toast.POSITION.TOP_CENTER,
          });
          if (err) {
            toast.error("Transaction failed!", {
              position: toast.POSITION.TOP_CENTER,
            });
          } else {
            if (ressw) {
              (
                async () => {
                  toast.success("Success swapping to Transform Contract!", {
                    autoClose: 3000,
                    position: toast.POSITION.TOP_CENTER,
                  })
                  setApproved(true);
                  setBalanace(balance - parseInt(amountValue.current.value.replace(/,/g, "")));
                  setMaxAmount("0")
                }
              )()
            } else {
              (
                async () => {
                  setApproved(true);
                  setBalanace(balance - parseInt(amountValue.current.value.replace(/,/g, "")));
                  setMaxAmount("0")
                }
              )()
            }
          }
        }
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <div className="container">
      <Head>
        <title>Transform ASIX Token</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/asix.png" />
      </Head>

      <div className="container-fluid">
        <div className="row mt-3 bg-none justify-content-md-center">
          <div className="col-lg-8">
            <img alt="" className="img-header" src="/asix.png" />
          </div>
          <div className="col-lg-4">
            <div className="d-flex float-right justify-content-md-center">
              {isAuthenticated ? (
                <>
                  <button className="btn-wooden">
                    <img alt="" className="img-option" src="/asix.png" />
                    {wallet}
                  </button>
                  <button
                    onClick={async () => {
                      logoutEvt();
                    }}
                    className="btn-wooden"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    loginEvt();
                  }}
                  className="btn-wooden"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row mt-3 align-items-center justify-content-md-center">
          <div className="col-lg-5">
            <div className="card">
              <h5 className="card-header">TRANSFORM YOUR ASIX</h5>
              <div className="card-body">
                <div className="row">
                  <div className="col mb-3">
                    {isAuthenticated ? (
                      <small className="float-right text-success">
                        <i className="bi-circle-fill"></i> Connected
                      </small>
                    ) : (
                      <small className="float-right info">
                        <i className="bi-circle-fill"></i> Not Connected
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="send">
                    Amount
                  </label>
                  <p className="info float-right">
                    Balance :
                    {isAuthenticated
                      ? " " + formatUang(parseInt(balance).toString())
                      : " 0"}
                  </p>
                  <div className="input-group form">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <img alt=""
                          className="img-asix"
                          src="/asix01.png"
                        />
                      </span>
                    </div>
                    {isAuthenticated ? (
                      <input
                        type="text"
                        name="send"
                        id="send"
                        value={maxAmount}
                        className="form-control"
                        ref={amountValue}
                        onInput={(event) => {
                          hanyaAngka(event);
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={maxAmount}
                        className="form-control disabled"
                      />
                    )}
                    <div className="input-group-append">
                      <span className="input-group-text">
                        {isAuthenticated ? (
                          <button className="btn-max" onClick={() => maxSend()}>
                            Max
                          </button>
                        ) : (
                          <button disabled className="btn-max disabled">
                            Max
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row justify-content-md-center mt-5 text-center">
                  {isAuthenticated && (
                    <div className="col-lg-12 mb-1 d-flex">
                      {approved ? (
                        <>
                          <button disabled className="btn-wooden-disabled disabled btn-card mx-auto">
                            Enabled
                          </button>
                          <button
                            className="btn-wooden btn-card mx-auto"
                            onClick={() => Transform()}
                          >
                            Transform
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-wooden btn-card mx-auto"
                            onClick={() => approve()}
                          >
                            Enable
                          </button>

                          <button disabled className="btn-wooden-disabled disabled btn-card mx-auto">
                            Transform
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
}