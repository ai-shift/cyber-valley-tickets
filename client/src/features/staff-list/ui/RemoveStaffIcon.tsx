type RemoveStaffIconProps = {
  staffAdress: string;
};

export const RemoveStaffIcon: React.FC<RemoveStaffIconProps> = ({
  staffAdress,
}) => {
  function deleteHandler() {
    //TODO: deleteStaffAddress
  }

  return (
    <button
      className="h-full cursor-pointer"
      type="button"
      onClick={deleteHandler}
    >
      <img className="h-full" src="/icons/manage_4.svg" alt="edit_button" />
    </button>
  );
};
