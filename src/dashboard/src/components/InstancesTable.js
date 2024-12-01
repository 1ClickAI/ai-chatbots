import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUnlink, faQrcode, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import './InstancesTable.css';

function InstancesTable({
    apiKey,
    instances,
    setInstances,
    setModalData,
    fetchInstances,
    handleNotification,
}) {
    const deleteInstance = async (udid) => {
        const userConfirmed = window.confirm("Are you sure you want to delete this instance?");
        if (!userConfirmed) {
            return;
        }
    
        try {
            const response = await fetch(`/api/instances/${udid}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${apiKey}` },
            });
    
            if (response.status === 200) {
                handleNotification('Instance deleted successfully.', 'success');
                fetchInstances();
            } else {
                handleNotification('Failed to delete instance.', 'error');
            }
        } catch (error) {
            handleNotification('Error deleting instance.', 'error');
        }
    };
    

    const disconnectInstance = async (udid) => {
        try {
            const response = await fetch(`/api/instances/${udid}/disconnect`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (response.status === 200) {
                handleNotification('Instance disconnected successfully.', 'success');
                fetchInstances();
            } else {
                handleNotification('Failed to disconnect instance.', 'error');
            }
        } catch (error) {
            handleNotification('Error disconnecting instance.', 'error');
        }
    };

    return (
        <div className="responsive-table">
            {instances.length > 0 ? (
                <table className="table table-striped table-dark text-center d-none d-md-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone Number</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {instances.map((instance) => (
                            <tr key={instance.udid}>
                                <td>{instance.udid}</td>
                                <td>{instance.phone_number || 'N/A'}</td>
                                <td>{instance.status}</td>
                                <td>
                                    {instance.status === 'connected' ? (
                                        <button
                                            className="btn btn-warning me-2"
                                            onClick={() => disconnectInstance(instance.udid)}
                                        >
                                            <FontAwesomeIcon icon={faUnlink} />
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-primary me-2"
                                            onClick={() => setModalData(instance)}
                                        >
                                            <FontAwesomeIcon icon={faQrcode} />
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => deleteInstance(instance.udid)}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-center">No instances available.</p>
            )}
            <div className="responsive-cards d-md-none">
                {instances.map((instance) => (
                    <div className="card mb-3" key={instance.udid}>
                        <div className="card-body">
                            <p>
                                <strong>Name:</strong> {instance.udid}
                            </p>
                            <p>
                                <strong>Phone Number:</strong> {instance.phone_number || 'N/A'}
                            </p>
                            <p>
                                <strong>Status:</strong> {instance.status}
                            </p>
                            <div>
                                {instance.status === 'connected' ? (
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => disconnectInstance(instance.udid)}
                                    >
                                        <FontAwesomeIcon icon={faUnlink} />
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setModalData(instance)}
                                    >
                                        <FontAwesomeIcon icon={faQrcode} />
                                    </button>
                                )}
                                <button
                                    className="btn btn-danger"
                                    onClick={() => deleteInstance(instance.udid)}
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default InstancesTable;
