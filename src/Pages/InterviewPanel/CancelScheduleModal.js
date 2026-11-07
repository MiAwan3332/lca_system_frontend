import React,{useState} from 'react';
import {Modal,ModalOverlay,ModalContent,ModalHeader,ModalBody,ModalFooter,ModalCloseButton,FormLabel,Button,Text,Textarea} from '@chakra-ui/react';
import axios from 'axios';import Cookies from 'js-cookie';import {config} from '../../utlls/config';

export default function CancelScheduleModal({row,onClose,onSaved}){
  const [reason,setReason]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const save=async()=>{if(!reason.trim()){setError('Enter a cancellation reason');return;}setBusy(true);try{
    await axios.post(`${config.BASE_URL}/interview-panels/schedules/${row.panel_id}/${row.schedule_id}/cancel`,{cancellation_reason:reason.trim(),expected_revision:row.panel_revision},{headers:{Authorization:'Bearer '+Cookies.get('authToken')}});
    onSaved();onClose();setReason('');setError('');
  }catch(e){setError(e.response?.data?.message||e.message);}finally{setBusy(false);}};
  return <Modal isOpen={Boolean(row)} onClose={onClose}><ModalOverlay/><ModalContent><ModalHeader>Cancel interview schedule</ModalHeader><ModalCloseButton/><ModalBody><Text mb={3}>The booking and any history will be retained. The slot will no longer be available for interviews.</Text><FormLabel>Cancellation reason</FormLabel><Textarea value={reason} onChange={e=>setReason(e.target.value)} />{error&&<Text role="alert" color="red.500">{error}</Text>}</ModalBody><ModalFooter><Button variant="ghost" onClick={onClose}>Back</Button><Button colorScheme="red" ml={3} isLoading={busy} onClick={save}>Cancel schedule</Button></ModalFooter></ModalContent></Modal>;
}
