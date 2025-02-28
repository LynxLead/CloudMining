import React, { useContext, useState, useEffect } from 'react';
import { Header, Modal, Menu, Icon, Message } from 'semantic-ui-react';
import styled from 'styled-components/macro';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import { PactContext } from '../../contexts/PactContext';
import theme from '../../styles/theme';
import Checkbox from '../../components/shared/Checkbox';
import { ReactComponent as LockIcon } from '../../assets/images/shared/lock.svg';
import { ReactComponent as UnlockIcon } from '../../assets/images/shared/unlock.svg';
import getAccounts from '../../utils/getZelcoreAccts';
import swal from '@sweetalert/with-react'
import walletAccts from '../../components/alerts/walletAccts'
import walletError from '../../components/alerts/walletError'
import selectAcct from '../../components/alerts/selectAcct'
import '../../styles/inputoverride.css';

export default function Account(props) {

  const pact = useContext(PactContext);
  const [acct, setAcct] = useState((pact.account.account ? pact.account.account : ""))
  const [locked, setLocked] = useState((pact.account.account && pact.hasWallet() ? true : false));
  const [method, setMethod] = useState(pact.signing.method);
  const [pk, setPk] = useState('');
  const [pw, setPw] = useState('');
  const [pwConf, setPwConf] = useState('');
  const [temp, setTemp] = useState('');
  const [zelAcct, setZelAcct] = useState();
  const [loading, setLoading] = useState(false);


  const is_hexadecimal = (str) => {
    const regexp = /^[0-9a-fA-F]+$/;
    if (regexp.test(str)) return true;
    else return false;
  };

  const checkKey = (key) => {
    try {
      if (key.length !== 64) {
        return false;
      } else if (!is_hexadecimal(key)) {
        return false;
      }
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  const canSubmit = () => {
    if (method === 'sign') return true;
    if (method === 'pk' && checkKey(pk)) return true;
    if (method === 'pk+pw' && pw === pwConf && checkKey(pk) && pw !== '') return true;
    return false;
  };


  const resetValues = () => {
    setLocked(false);
    setPk('');
    setPw('');
    setPwConf('');
    setLocked(true);
  };

  return (
    <Modal
      onClose={() => {
        pact.setRegistered(true);
        resetValues();
        props.onClose();
      }}
      open={props.open}
    >
      <Modal.Content image>
        <Modal.Description>
          <Header style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 24, fontFamily: 'neue-bold', color: '#3a4750' }}>Your KDA Account (chain 1)</span>
          </Header>
          <Input
            placeholder="Enter Account"
            error={pact.account.account === null && temp !== ''}
            containerStyle={{ marginBottom: 22 }}
            value={acct}
            onChange={async (e, { value }) => {
              setAcct(value);
              setTemp(value);
              await pact.setVerifiedAccount(value);
            }}
            rightLabel={
              <>
              <div style={{}}>
                Please download
                <a
                  style={{ marginLeft: 3}}
                  href="https://github.com/ZelCore-io/ZelCore/releases/tag/v4.9.0-beta-build-2615"
                  target="_blank"
                >
                  Latest version
                </a>
              </div>
              <Button
                onClick={async () => {
                  setLoading(true);
                  walletAccts()
                  const accts = await getAccounts();
                  swal.close()
                  if (accts.status === 'success') {
                    setAcct(accts.data[0]);
                    setTemp(accts.data[0]);
                    await pact.setVerifiedAccount(accts.data[0]);
                    await selectAcct(accts.data, setAcct, setTemp, pact.setVerifiedAccount);
                  } else {
                    walletError()
                  }
                  setLoading(false);
                }}
                style={{marginLeft: 30, marginBottom: 0}}
                loading={loading}
              >
                get zelcore accounts
              </Button>

              </>
            }
          />
          {pact.account.account ? (
            <>
              <Header>
                <span style={{ fontSize: 24, fontFamily: 'neue-bold', color: theme.colors.primary }}>Account Details</span>
              </Header>
              <Message color='purple'>
                <Message.Header style={{ display: 'flex', justifyContent: 'center', margin: 10 }}>
                  <span>{JSON.stringify(pact.account.guard, null, '\t')}</span>
                </Message.Header>
              </Message>
            </>
          ) : temp === '' ? (
            <></>
          ) : (
            <Header>
              <span style={{ color: "red", fontSize: 24, fontFamily: 'neue-bold' }}>Account Does Not Exist (Send KDA to Chain 1)</span>
            </Header>
          )}
          <div style={{ opacity: pact?.account?.account ? 1 : 0.3, marginTop: 30, marginBottom: 30 }}>
          <Header>
            <span style={{ fontSize: 24, fontFamily: 'neue-bold', color: '#3a4750', marginRight: 16 }}>Signing Method</span>
            {locked ?
              <span>
              <Button
                background="white"
                color="#c56cf0"
                buttonStyle={{ border: '1px solid #c56cf0' }}
                fontSize={16}
                onClick={() => {
                  setLocked(false)
                  localStorage.removeItem('signing', null);
                  pact.setSigning({ method: 'none', key: "" })
                }}
              >
                Reset
              </Button>
              </span>
              : <></>
            }
          </Header>
          <Menu color="purple" widths={3}>
            <Menu.Item
              name="pk"
              active={method === 'pk'}
              onClick={() => setMethod('pk')}
              disabled={locked}
            >
              <Icon name="warning sign" />
              Plain Private Key (unsafe)
            </Menu.Item>

            <Menu.Item
              name="pk+pw"
              active={method === 'pk+pw'}
              onClick={() => setMethod('pk+pw')}
              disabled={locked}
            >
              <Icon name="lock" />
              Private Key + Password (safe)
            </Menu.Item>

            <Menu.Item
              name="sign"
              active={method === 'sign'}
              onClick={() => setMethod('sign')}
              disabled={locked}
            >
              <Icon name="signup" />
              Chainweaver / Zelcore Signing (safest)
            </Menu.Item>
          </Menu>
          </div>
          {locked
            ?
            <div>
            </div>
            :
            <>
            {method === 'pk' && (
              <>
                <div style={{ display: 'flex', flexFlow: 'column', alignItems: 'center' }}>
                  <span style={{ color: '#BE3144', fontFamily: 'neue-bold', fontSize: 16, marginBottom: 10 }}><Icon name='warning sign' /> Note</span>
                  <span style={{ color: '#BE3144', fontSize: 13, marginBottom: 10 }}>
                    All your transactions will be automatically signed with these keys
                  </span>
                  <span style={{ color: '#BE3144', fontSize: 13, marginBottom: 10 }}>
                    Your private key will be saved in browser storage making easily accessible to malicious actors
                  </span>
                </div>
                <Input
                  leftLabel="private key"
                  placeholder="Insert your Private Key"
                  value={pk}
                  onChange={(e, { value }) => setPk(value)}
                  error={pk !== '' ? !checkKey(pk) : false}
                />
              </>
            )}
            {method === 'pk+pw' && (
              <>
                <div style={{ display: 'flex', flexFlow: 'column', alignItems: 'center' }}>
                  <span style={{ color: '#FF9509', fontFamily: 'neue-bold', fontSize: 16, marginBottom: 10 }}><Icon name='warning sign' /> Note</span>
                  <span style={{ color: '#FF9509', fontSize: 13, marginBottom: 10 }}>
                    You will be prompted to enter your password to submit transactions
                  </span>
                  <span style={{ color: '#FF9509', fontSize: 13, marginBottom: 10 }}>
                    You can always reset your password by following this process again with your private key
                  </span>
                </div>
                <Input
                  leftLabel="your private key"
                  value={pk}
                  placeholder="Insert Your Private Key"
                  containerStyle={{ marginBottom: 16 }}
                  onChange={(e, { value }) => setPk(value)}
                  error={pk !== '' ? !checkKey(pk) : false}
                />
                <Input
                  leftLabel="your password"
                  value={pw}
                  placeholder="Insert Your Password"
                  containerStyle={{ marginBottom: 16 }}
                  onChange={(e, { value }) => setPw(value)}
                  type="password"
                  error={pw !== pwConf}
                />
                <Input
                  leftLabel="confirm password"
                  value={pwConf}
                  placeholder="Confirm Your Password"
                  containerStyle={{ marginBottom: 16 }}
                  onChange={(e, { value }) => setPwConf(value)}
                  type="password"
                  error={pw !== pwConf}
                />
              </>
            )}
            {method === 'sign' && (
              <div style={{ display: 'flex', flexFlow: 'column', alignItems: 'center' }}>
                <span style={{ color: '#1B781B', fontFamily: 'neue-bold', fontSize: 16, marginBottom: 10 }}><Icon name='warning sign' /> Note</span>
                <span style={{ color: '#1B781B', fontSize: 13, marginBottom: 10 }}>
                  Please make sure the KDA account provided is controlled by your Chainweaver wallet
                </span>
                <span style={{ color: '#1B781B', fontSize: 13, marginBottom: 10 }}>
                  When submitting a transaction, Chainweaver will show you a preview within the wallet before signing
                </span>
                <span style={{ color: '#1B781B', fontSize: 13, marginBottom: 10 }}>
                  Download Chainweaver <a style={{ color: '#1B781B', textDecoration: 'underline' }}>here</a>
                </span>
              </div>
            )}
            </>
          }
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button
          background="white"
          color="#c56cf0"
          buttonStyle={{ border: '1px solid #c56cf0', padding: '10px 50px' }}
          fontSize={16}
          onClick={() => {
            resetValues();
            props.onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={async () => {
            if (method === 'pk') await pact.storePrivKey(pk);
            if (method === 'pk+pw') await pact.encryptKey(pk, pw);
            if (method === 'sign') await pact.signingWallet();
            resetValues();
            props.onClose();
          }}
          buttonStyle={{ padding: '10px 50px' }}
          disabled={!canSubmit()}
        >
          Update
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
