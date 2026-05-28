## Description: <br>
Desktop Agent lets an agent capture the screen, control mouse and keyboard actions, and save or replay taught desktop tasks. <br>

This skill is ready for commercial/non-commercial use. <br>

## Publisher: <br>
[fuzzyb33s](https://clawhub.ai/user/fuzzyb33s) <br>

### License/Terms of Use: <br>
MIT-0 <br>


## Use Case: <br>
Developers and power users can use this skill to let an agent inspect a live desktop, perform UI actions, and record reusable workflows for supervised automation. <br>

### Deployment Geography for Use: <br>
Global <br>

## Known Risks and Mitigations: <br>
Risk: The skill can see and control the live desktop, including mouse, keyboard, screenshots, and OCR-visible content. <br>
Mitigation: Use it only in supervised sessions, close sensitive applications, and avoid exposing passwords, tokens, or private documents while it is active. <br>
Risk: Saved task replay can repeat desktop actions without enough contextual judgment. <br>
Mitigation: Review saved task JSON before running it and run learned tasks only in the intended application state. <br>
Risk: Untrusted task names or task files could cause unintended automation behavior. <br>
Mitigation: Use trusted task definitions only and keep the learned task directory under user control. <br>


## Reference(s): <br>
- [Desktop Agent on ClawHub](https://clawhub.ai/fuzzyb33s/desktop-agent) <br>


## Skill Output: <br>
**Output Type(s):** [code, shell commands, configuration, guidance] <br>
**Output Format:** [Markdown with Python code examples and command guidance] <br>
**Output Parameters:** [1D] <br>
**Other Properties Related to Output:** [May create screenshots and JSON task files when used by the agent.] <br>

## Skill Version(s): <br>
1.0.0 (source: server release evidence) <br>

## Ethical Considerations: <br>
Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment. <br>
