import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import InstancesTable from './components/InstancesTable';
import QRCodeModal from './components/QRCodeModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
    const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
    const [instances, setInstances] = useState([]);
    const [modalData, setModalData] = useState(null);
    const [newInstance, setNewInstance] = useState(''); // Campo para o novo UDID

    const apiUrl = '/api/instances';
    const LOGO = '/logo.png';

    // Fetch instances from the API
    const fetchInstances = async () => {
        if (!apiKey) return;
        try {
            const response = await fetch(apiUrl, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (response.status === 200) {
                const data = await response.json();
                setInstances(data);
            } else {
                toast.error('Failed to fetch instances. Please log in again.');
                localStorage.removeItem('apiKey');
                setApiKey('');
            }
        } catch (error) {
            toast.error('Error fetching instances.');
        }
    };

    // Add a new instance
    const addInstance = async () => {
        if (!newInstance.trim()) {
            toast.info('Please enter a valid UDID.');
            return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ udid: newInstance.trim() }),
            });

            if (response.status === 201) {
                toast.success('Instance created successfully.');
                setNewInstance('');
                fetchInstances(); // Refresh the instances
            } else {
                toast.error('Failed to create instance.');
            }
        } catch (error) {
            toast.error('Error creating instance.');
        }
    };

    // Logout function
    const handleLogout = () => {
        localStorage.removeItem('apiKey');
        setApiKey('');
    };

    useEffect(() => {
        if (apiKey) fetchInstances();
    }, [apiKey]);

    return (
        <div className="container my-5">
            <ToastContainer /> {/* Renderizador de notificações */}
            <div className="d-flex flex-column align-items-center">
                <img
                    src={LOGO}
                    alt="Logo"
                    className="img-fluid mb-4"
                    style={{ maxWidth: '80%', height: 'auto' }}
                />
            </div>
            {!apiKey ? (
                <>
                    <LoginForm setApiKey={setApiKey} handleNotification={toast} />
                </>
            ) : (
                <>
                    <div className="card bg-dark text-white shadow-lg mb-4">
                        <div className="card-body">
                            <h4 className="card-title text-center mb-3">Create New Instance</h4>
                            <div className="mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter instance name"
                                    value={newInstance}
                                    onChange={(e) => setNewInstance(e.target.value)}
                                />
                                <button
                                    className="btn btn-success mt-3 w-100"
                                    onClick={addInstance}
                                >
                                    Add Instance
                                </button>
                            </div>
                        </div>
                    </div>
                    <InstancesTable
                        apiKey={apiKey}
                        instances={instances}
                        setInstances={setInstances}
                        setModalData={setModalData}
                        fetchInstances={fetchInstances}
                        handleNotification={toast}
                    />
                    <div className="d-flex gap-2 mt-4">
                        <button
                            className="btn btn-info w-50"
                            onClick={() => window.open('/api-docs', '_blank')}
                        >
                            API Doc
                        </button>
                        <button
                            className="btn btn-danger w-50"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </>
            )}
            {modalData && (
                <QRCodeModal
                    modalData={modalData}
                    setModalData={setModalData}
                    apiKey={apiKey}
                    fetchInstances={fetchInstances}
                    handleNotification={toast}
                />
            )}
        </div>
    );
    
}

export default App;
