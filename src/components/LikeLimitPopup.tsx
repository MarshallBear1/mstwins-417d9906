import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LikeLimitPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LikeLimitPopup = ({ open, onOpenChange }: LikeLimitPopupProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Out of Likes</AlertDialogTitle>
          <AlertDialogDescription>
            You have used all your likes today. Come back tomorrow for more likes!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Got it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LikeLimitPopup;