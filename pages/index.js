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
  const [walletFull, setWalletFull] = useState('');
  const [login, setLogin] = useState(false);
  const [balance, setBalanace] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const [approved, setApproved] = useState(false);
  const [form, setForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const amountValue = useRef(null);
  Moralis.serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

  useEffect(async () => {
    if (isAuthenticated) {
      if (!login) {
        logout();
      } else {
        setLoading(true);
        const web3 = new Web3(window.ethereum);
        const walletAddress = await user.get("ethAddress");
        setWalletFull(walletAddress);
        setWallet(
          walletAddress.slice(0, 5) +
          "..." +
          walletAddress.slice(
            walletAddress.length - 4,
            walletAddress.length - 0
          )
        );
        
        if (form) {
          const cekAproveV1 = await cekAprove(process.env.TOKEN_V1, walletAddress);
          setApproved(cekAproveV1);
          const getbalance = await getBalanceV1(walletAddress);
          setBalanace(getbalance);
          setLoading(false);
        } else {
          const cekAproveV2 = await cekAprove(process.env.TOKEN_V2, walletAddress);
          setApproved(cekAproveV2);
          const getbalance = await getBalanceV2(walletAddress);
          setBalanace(getbalance);
          setLoading(false);
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
  }, [isAuthenticated, form]);

  //editan disini

  const cekAprove = async (token, walletAddress) => {
    const web3 = new Web3(window.ethereum);
    const tokcontract = new web3.eth.Contract(V2ABI, token);
    const isAprove = await tokcontract.methods
      .allowance(walletAddress, process.env.TRANSFORM)
      .call();
    if (isAprove > 0) return true;
    return false;
  }

  const getBalanceV1 = async (walletAddress) => {
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

  const getBalanceV2 = async (walletAddress) => {
    const options = {
      chain: "bsc",
      address: walletAddress,
      token_addresses: process.env.TOKEN_V2,
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
      signingMessage: "Signing in ASIX Upgrade",
    });
  }

  const logoutEvt = async () => {
    await logout();
    setWallet("");
    setWalletFull("")
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

  //tambah approval atau enable + Upgrade disini

  const approveV1 = async () => {
    const web3 = new Web3(window.ethereum);
    try {
      let user = Moralis.User.current();
      const walletAddress = await user.get("ethAddress");
      await Moralis.enableWeb3();

      let tokcontract = new web3.eth.Contract(V2ABI, process.env.TOKEN_V1);
      const amountApprove = new BigNumber(10000000000000000000000000 * 10 ** 23).toFixed()
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

  const approveV2 = async () => {
    const web3 = new Web3(window.ethereum);
    try {
      let user = Moralis.User.current();
      const walletAddress = await user.get("ethAddress");
      await Moralis.enableWeb3();

      let tokcontract = new web3.eth.Contract(V2ABI, process.env.TOKEN_V2);
      const amountApprove = new BigNumber(10000000000000000000000000 * 10 ** 23).toFixed()
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

  const UpgradeV1 = async () => {
    const web3 = new Web3(window.ethereum);
    try {
      let user = Moralis.User.current();
      const walletAddress = user.get("ethAddress");
      await Moralis.enableWeb3();

      let UpV1 = new web3.eth.Contract(TRANSFORM_ABI, process.env.TRANSFORM);
      const amountSwap = new BigNumber(parseInt(amountValue.current.value.replace(/,/g, ""))).toFixed()

      UpV1.methods.Upgrade_V1(amountSwap).send(
        {
          from: walletAddress,
          value: 0,
        },
        (err, ressw) => {
          toast.info("Upgrading your ASIX_V1. Please wait", {
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
                  toast.success("Success upgrading to Upgrade Contract!", {
                    autoClose: 3000,
                    position: toast.POSITION.TOP_CENTER,
                  })
                  setApproved(true);
                  setBalanace(balance - parseInt(amountValue.current.value.replace(/,/g, "")));
                  setMaxAmount("0")
                }
              )()
            } else {
              setApproved(true);
              setBalanace(balance - parseInt(amountValue.current.value.replace(/,/g, "")));
              setMaxAmount("0");
            }
          }
        }
      );
    } catch (error) {
      console.log(error.message);
    }
  }


  const UpgradeV2 = async () => {
    const web3 = new Web3(window.ethereum);
    try {
      let user = Moralis.User.current();
      const walletAddress = user.get("ethAddress");
      await Moralis.enableWeb3();

      let UpV2 = new web3.eth.Contract(TRANSFORM_ABI, process.env.TRANSFORM);
      const amountSwap = new BigNumber(parseInt(amountValue.current.value.replace(/,/g, ""))).toFixed()

      UpV2.methods.Upgrade_V2(amountSwap).send(
        {
          from: walletAddress,
          value: 0,
        },
        (err, ressw) => {
          toast.info("Upgrading your ASIX_V2. Please wait", {
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
                  toast.success("Success upgrading to Upgrade Contract!", {
                    autoClose: 3000,
                    position: toast.POSITION.TOP_CENTER,
                  })
                  setApproved(true);
                  setBalanace(balance - parseInt(amountValue.current.value.replace(/,/g, "")));
                  setMaxAmount("0")
                }
              )()
            } else {
              setApproved(true);
              setBalanace(balance - parseInt(amountValue.current.value.replace(/,/g, "")));
              setMaxAmount("0")
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
        <title>Upgrade ASIX Token</title>
        <meta name="description" content="Official dapps to upgrade your ASIX Token" />
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
              <h5 className="card-header">UPGRADE YOUR ASIX</h5>
              <div className="card-body">
                <div className="text-center">
                  <button className={form ? "btn-switch1" : "btn-switch2"} onClick={() => {
                    setForm(prev => !prev);
                    setMaxAmount('0');
                  }}></button>
                </div>
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
                    Amount {form ? ' V1' : ' V2'}
                  </label>
                  <p className="info float-right">
                    {
                      loading ? (
                        <div className="d-flex">
                          <small className="placeholder-glow mb-1">
                            <span className="placeholder col-12 placeholder-lg"></span>
                          </small>
                        </div>
                      ) : isAuthenticated
                        ? 'Balance : '+formatUang(parseInt(balance).toString())
                        : "Balance : 0"
                    }
                  </p>
                  <div className="input-group form">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <img alt=""
                          className="img-asix"
                          src={form ? "/asix01.png" : "/asix02.png"}
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
                <div className="row justify-content-md-center mt-1 text-center">
                  {isAuthenticated && (
                    <div className="col-lg-12 mb-1 d-flex">
                      {approved ? (
                        <>
                          <button disabled className="btn-wooden-disabled disabled btn-card mx-auto">
                            Enabled
                          </button>
                          <button
                            className="btn-wooden btn-card mx-auto"
                            onClick={() => {
                              form ? UpgradeV1() : UpgradeV2()
                            }}
                          >
                            Upgrade {form ? ' V1' : ' V2'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-wooden btn-card mx-auto"
                            onClick={() => {
                              form ? approveV1() : approveV2
                            }}
                          >
                            Enable {form ? ' V1' : ' V2'}
                          </button>

                          <button disabled className="btn-wooden-disabled disabled btn-card mx-auto">
                            Upgrade {form ? ' V1' : ' V2'}
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
