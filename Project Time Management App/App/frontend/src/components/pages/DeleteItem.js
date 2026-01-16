import React from 'react';

function DeleteItem({ id, onDelete }) {
  return (
    // Button to trigger the deletion of an item
    <button onClick={() => onDelete(id)}>Delete</button>
  );
}

export default DeleteItem;


